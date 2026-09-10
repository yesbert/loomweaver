import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Service, signal } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { NotificationInput } from '@loomweaver/plugin-sdk';
import { NotificationService } from '../notifications/notification.service';
import { ANNOUNCE_UPDATES } from './announce-updates';

/**
 * What a check for a new version found. `waiting` means one is downloaded and ready to apply,
 * `current` that this is the newest version, `unreachable` that the question could not be answered,
 * `failed` that an installation went wrong, and `unavailable` that the application has no offline
 * machinery to check with (dev, or a build that ships no service worker).
 */
export type UpdateOutcome =
  'waiting' | 'current' | 'unreachable' | 'failed' | 'unavailable';

/** The last check the workbench made, whether a caller asked for it or the workbench made it itself. */
export interface UpdateCheck {
  readonly outcome: UpdateOutcome;
  /** When it happened, as `Date.now()`. */
  readonly at: number;
  /** `true` where the workbench checked by itself, `false` where a caller asked. */
  readonly automatic: boolean;
}

const UPDATE_TOAST_ID = 'shell.update';
const UP_TO_DATE_TOAST_ID = 'shell.update.none';
const CHECK_UNAVAILABLE_TOAST_ID = 'shell.update.unavailable';
const UPDATE_FAILED_TOAST_ID = 'shell.update.failed';
const BROKEN_CACHE_TOAST_ID = 'shell.update.broken';

const CONTROL_WAIT_MS = 2500;

const CHECK_TIMEOUT_MS = 3500;

const PERIODIC_CHECK_MS = 30 * 60 * 1000;

const SILENT_CHECK_GAP_MS = 60 * 1000;

const WORKER_SCRIPT = 'ngsw-worker.js';

const WORKER_CACHE_PREFIX = 'ngsw:';

async function bestEffort(work: () => Promise<unknown>): Promise<void> {
  try {
    await work();
  } catch {
    return;
  }
}

function isShellWorker(registration: ServiceWorkerRegistration): boolean {
  const worker =
    registration.active ?? registration.waiting ?? registration.installing;
  return worker?.scriptURL.includes(WORKER_SCRIPT) ?? false;
}

/**
 * Detects when a new app version has been fetched by the service worker and offers
 * to activate it. Neutral core chrome: it raises a sticky toast and drives
 * the persistent update badge off {@link updateAvailable}. Dismissing the toast never
 * clears that signal, so the badge stays until the user actually reloads.
 *
 * `SwUpdate` is injected optionally: with no registered service worker (dev, tests,
 * unsupported browsers) the service is simply inert — {@link enabled} is `false` and
 * no update is ever offered.
 */
@Service()
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate, { optional: true });

  private readonly notifications = inject(NotificationService);

  private readonly announces = inject(ANNOUNCE_UPDATES);

  private readonly document = inject(DOCUMENT);

  private readonly destroyRef = inject(DestroyRef);

  private readonly available = signal(false);

  private readonly failed = signal(false);

  private readonly broken = signal(false);

  private lastSilentCheck = 0;

  private readonly checked = signal<UpdateCheck | null>(null);

  /** True once a new version is downloaded and ready to activate. */
  readonly updateAvailable = this.available.asReadonly();

  /**
   * True once an update could not be installed, whichever of the two ways it went wrong.
   * The client keeps running its current version until a reload; the badge and the failure
   * toast both offer that reload. Read {@link updateBroken} to tell the two apart.
   */
  readonly updateFailed = this.failed.asReadonly();

  /**
   * True once the service worker reports an unrecoverable state, which is the harsher half of
   * {@link updateFailed}: its cached asset table no longer matches what the server serves, so it
   * cannot repair itself and a plain reload lands in the same state again. {@link activateUpdate}
   * handles it by dropping the worker rather than reloading into the same wall; read this only if
   * you want to say something different about it in your own UI.
   */
  readonly updateBroken = this.broken.asReadonly();

  /** Whether update checks are possible (a service worker is registered and enabled). */
  readonly enabled = this.swUpdate?.isEnabled ?? false;

  /**
   * The last check the workbench made, or `null` before the first one. Set by
   * {@link checkForUpdate} and by the workbench's own background checks alike, so a distribution can
   * draw what happened — including a check nobody asked for — instead of learning of it through the
   * toast. Reading it never triggers a check.
   */
  readonly lastCheck = this.checked.asReadonly();

  constructor() {
    this.swUpdate?.versionUpdates.subscribe((event) =>
      this.onVersionEvent(event),
    );
    this.swUpdate?.unrecoverable.subscribe(() => this.onWorkerBroken());
    this.startBackgroundChecks();
  }

  /**
   * Checks for a new version and reports what it found, noting when already up to date. The outcome
   * is also recorded in {@link lastCheck}. Where the distribution announces updates itself
   * (`provideShell({ announceUpdates: false })`) the workbench shows nothing and the caller draws
   * the answer.
   */
  async checkForUpdate(): Promise<UpdateOutcome> {
    if (!this.swUpdate?.isEnabled) {
      return this.record('unavailable', false);
    }
    if (this.available()) {
      this.showUpdateAvailable();
      return this.record('waiting', false);
    }

    if (!(await this.ensureControlled())) {
      this.showReloadNeeded();
      return this.record('unreachable', false);
    }

    this.lastSilentCheck = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = Symbol('timedOut');
    const guard = new Promise<typeof timedOut>((resolve) => {
      timer = setTimeout(() => resolve(timedOut), CHECK_TIMEOUT_MS);
    });
    const found = await Promise.race([
      this.swUpdate.checkForUpdate().catch(() => timedOut),
      guard,
    ]);
    clearTimeout(timer);

    if (found === timedOut) {
      this.showReloadNeeded();
      return this.record('unreachable', false);
    }
    if (found) {
      return this.record('waiting', false);
    }
    if (this.failed()) {
      this.showUpdateFailed();
      return this.record('failed', false);
    }
    this.announce({
      id: UP_TO_DATE_TOAST_ID,
      kind: 'success',
      message: 'update.upToDate',
      timeoutMs: 4000,
    });
    return this.record('current', false);
  }

  /**
   * Gets the client onto a working version and reloads into it — it reloads even if that fails,
   * so the affordance is never a silent no-op.
   *
   * When the worker is {@link updateBroken} activating is pointless: the broken registration would
   * still control the next load and report the same failure, which is a loop the user cannot leave
   * from inside the app. There the shell unregisters its own worker and drops its caches first, so
   * the reload lands uncontrolled and registers afresh. Only the shell's own `ngsw-worker.js` and
   * the `ngsw:` caches are touched; anything else the product registered is left alone.
   */
  async activateUpdate(): Promise<void> {
    if (this.broken()) {
      await this.dropWorker();
    } else {
      await this.tryActivate();
    }
    this.document.defaultView?.location.reload();
  }

  private ensureControlled(): Promise<boolean> {
    const container = this.document.defaultView?.navigator?.serviceWorker;
    if (!container) {
      return Promise.resolve(true);
    }
    if (container.controller) {
      return Promise.resolve(true);
    }
    return new Promise<boolean>((resolve) => {
      const done = (controlled: boolean) => {
        clearTimeout(timer);
        container.removeEventListener('controllerchange', onChange);
        resolve(controlled);
      };
      const onChange = () => done(container.controller !== null);
      const timer = setTimeout(() => done(false), CONTROL_WAIT_MS);
      container.addEventListener('controllerchange', onChange);
    });
  }

  private showReloadNeeded(): void {
    this.announce({
      id: CHECK_UNAVAILABLE_TOAST_ID,
      kind: 'info',
      message: 'update.checkUnavailable',
      timeoutMs: 6000,
    });
  }

  private async tryActivate(): Promise<void> {
    try {
      if (this.swUpdate?.isEnabled) {
        await this.swUpdate.activateUpdate();
      }
    } catch {
      return;
    }
  }

  private async dropWorker(): Promise<void> {
    const view = this.document.defaultView;
    const container = view?.navigator?.serviceWorker;
    await bestEffort(async () => {
      const registrations = (await container?.getRegistrations()) ?? [];
      await Promise.all(
        registrations
          .filter((registration) => isShellWorker(registration))
          .map((registration) => registration.unregister()),
      );
    });
    await bestEffort(async () => {
      const storage = view?.caches;
      const keys = (await storage?.keys()) ?? [];
      await Promise.all(
        keys
          .filter((key) => key.startsWith(WORKER_CACHE_PREFIX))
          .map(async (key) => storage?.delete(key)),
      );
    });
  }

  private onVersionEvent(event: VersionEvent): void {
    if (event.type === 'VERSION_READY') {
      this.onUpdateReady();
    } else if (event.type === 'VERSION_INSTALLATION_FAILED') {
      this.onUpdateFailed();
    }
  }

  private onUpdateReady(): void {
    this.available.set(true);
    this.failed.set(false);
    this.broken.set(false);
    this.showUpdateAvailable();
  }

  private showUpdateAvailable(): void {
    this.announce({
      id: UPDATE_TOAST_ID,
      kind: 'info',
      message: 'update.available',
      action: { label: 'update.reload', run: () => void this.activateUpdate() },
    });
  }

  private onUpdateFailed(): void {
    this.failed.set(true);
    this.showUpdateFailed();
  }

  private onWorkerBroken(): void {
    this.failed.set(true);
    this.broken.set(true);
    this.showUpdateFailed();
  }

  private showUpdateFailed(): void {
    if (this.broken()) {
      this.announce({
        id: BROKEN_CACHE_TOAST_ID,
        kind: 'warning',
        message: 'update.broken',
        action: {
          label: 'update.repair',
          run: () => void this.activateUpdate(),
        },
      });
      return;
    }
    this.announce({
      id: UPDATE_FAILED_TOAST_ID,
      kind: 'warning',
      message: 'update.failed',
      action: { label: 'update.reload', run: () => void this.activateUpdate() },
    });
  }

  private startBackgroundChecks(): void {
    if (!this.swUpdate?.isEnabled) {
      return;
    }
    const timer = setInterval(() => void this.silentCheck(), PERIODIC_CHECK_MS);
    const onVisibility = () => {
      if (this.document.visibilityState === 'visible') {
        void this.silentCheck();
      }
    };
    this.document.addEventListener('visibilitychange', onVisibility);
    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      this.document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  private async silentCheck(): Promise<void> {
    if (!this.swUpdate?.isEnabled || this.available()) {
      return;
    }
    const now = Date.now();
    if (now - this.lastSilentCheck < SILENT_CHECK_GAP_MS) {
      return;
    }
    this.lastSilentCheck = now;
    const found = await this.swUpdate
      .checkForUpdate()
      .catch(() => 'unreachable' as const);
    if (found === 'unreachable') {
      this.record('unreachable', true);
      return;
    }
    this.record(found ? 'waiting' : 'current', true);
  }

  private record(outcome: UpdateOutcome, automatic: boolean): UpdateOutcome {
    this.checked.set({ outcome, at: Date.now(), automatic });
    return outcome;
  }

  private announce(notice: NotificationInput): void {
    if (!this.announces) {
      return;
    }
    this.notifications.show(notice);
  }
}
