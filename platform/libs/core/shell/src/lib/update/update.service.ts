import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Service, signal } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { NotificationService } from '../notifications/notification.service';
import { ANNOUNCE_UPDATES } from './announce-updates';
import { UpdateNotice, updateNotice } from './update-notices';
import { dropShellWorker } from './worker-repair';

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

const CONTROL_WAIT_MS = 2500;

const CHECK_TIMEOUT_MS = 3500;

const PERIODIC_CHECK_MS = 30 * 60 * 1000;

const SILENT_CHECK_GAP_MS = 60 * 1000;

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

  private readonly isAnnouncing = inject(ANNOUNCE_UPDATES);

  private readonly document = inject(DOCUMENT);

  private readonly destroyRef = inject(DestroyRef);

  private readonly available = signal(false);

  private readonly failed = signal(false);

  private readonly broken = signal(false);

  private lastCheckAt = 0;

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
      this.announce('waiting');
      return this.record('waiting', false);
    }

    if (!(await this.ensureControlled())) {
      this.announce('unreachable');
      return this.record('unreachable', false);
    }

    this.lastCheckAt = Date.now();
    const found = await this.checkWithin(this.swUpdate, CHECK_TIMEOUT_MS);

    if (found === 'unreachable') {
      this.announce('unreachable');
      return this.record('unreachable', false);
    }
    if (found) {
      return this.record('waiting', false);
    }
    if (this.failed()) {
      this.announceFailure();
      return this.record('failed', false);
    }
    this.announce('current');
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
      await dropShellWorker(this.document.defaultView);
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

  private async checkWithin(
    swUpdate: SwUpdate,
    ms: number,
  ): Promise<boolean | 'unreachable'> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<'unreachable'>((resolve) => {
      timer = setTimeout(() => resolve('unreachable'), ms);
    });
    const found = await Promise.race([
      swUpdate.checkForUpdate().catch(() => 'unreachable' as const),
      deadline,
    ]);
    clearTimeout(timer);
    return found;
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
    this.announce('waiting');
  }

  private onUpdateFailed(): void {
    this.failed.set(true);
    this.announceFailure();
  }

  private onWorkerBroken(): void {
    this.failed.set(true);
    this.broken.set(true);
    this.announceFailure();
  }

  private announceFailure(): void {
    this.announce(this.broken() ? 'broken' : 'failed');
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
    if (now - this.lastCheckAt < SILENT_CHECK_GAP_MS) {
      return;
    }
    this.lastCheckAt = now;
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

  private announce(notice: UpdateNotice): void {
    if (!this.isAnnouncing) {
      return;
    }
    this.notifications.show(
      updateNotice(notice, () => void this.activateUpdate()),
    );
  }
}
