import { computed, Service, signal } from '@angular/core';
import {
  NotificationAction,
  NotificationInput,
  NotificationKind,
} from '@loomweaver/plugin-sdk';
import { LifetimeClock } from './lifetime-clock';
import {
  HOLD_REMAINDER_MS,
  lifetimeOf,
  STAYS,
} from './notification-lifetime';

/** A notification to show, as the toast outlet or a distribution's own drawing reads it. */
export interface Notification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly message: string;
  /** The icon the raiser named instead of the kind's (registry name); absent where the kind's is shown. */
  readonly icon?: string;
  /** How often the notification was raised while it was there: `1`, and more once it was repeated. */
  readonly count: number;
  readonly action?: NotificationAction;
}

export interface RaiserLimits {
  readonly atOnce: number;
  readonly lifetimeMs: number;
}

interface LiveNotification {
  readonly key: number;
  readonly notification: Notification;
  readonly raiser: string | undefined;
  readonly name: string | undefined;
  readonly returnedId: string;
  readonly lifetimeMs: number;
  readonly isLimited: boolean;
}

const SHOWN_AT_ONCE = 3;

@Service()
export class NotificationBoard {
  private readonly live = signal<readonly LiveNotification[]>([]);
  private readonly clock = new LifetimeClock((key) => this.remove(key));
  private readonly limits = new Map<string, RaiserLimits>();
  private nextKey = 0;
  private nextGeneratedId = 0;

  readonly shown = computed<readonly Notification[]>(() =>
    this.live()
      .slice(0, SHOWN_AT_ONCE)
      .map((entry) => entry.notification),
  );

  show(input: NotificationInput, raiser?: string): string {
    const existing = this.liveAs(input, raiser);
    if (existing) {
      return this.showAgain(existing, input);
    }
    const limits = raiser === undefined ? undefined : this.limits.get(raiser);
    if (raiser !== undefined && limits) {
      this.refuseBeyond(limits, raiser);
    }
    if (raiser === undefined && input.id !== undefined) {
      this.takeBack(input.id);
    }
    return this.showFirst(input, raiser, limits);
  }

  dismiss(id: string): void {
    const entry = this.live().find((live) => live.notification.id === id);
    if (entry) {
      this.remove(entry.key);
    }
  }

  hold(): void {
    if (this.live().length > 0) {
      this.clock.hold();
    }
  }

  release(): void {
    this.clock.release(HOLD_REMAINDER_MS);
  }

  limit(raiser: string, limits: RaiserLimits): () => void {
    this.limits.set(raiser, limits);
    return () => this.limits.delete(raiser);
  }

  private showFirst(
    input: NotificationInput,
    raiser: string | undefined,
    limits: RaiserLimits | undefined,
  ): string {
    const id = this.freeIdFor(input, raiser);
    const entry: LiveNotification = {
      key: this.nextKey++,
      notification: notificationOf(id, input, 1),
      raiser,
      name: input.id,
      returnedId: id,
      lifetimeMs: limitedLifetime(lifetimeOf(input), limits),
      isLimited: limits !== undefined,
    };
    this.live.update((entries) => queued(entries, entry));
    this.startLifetimesOfShown();
    return id;
  }

  private showAgain(
    existing: LiveNotification,
    input: NotificationInput,
  ): string {
    const { id, count } = existing.notification;
    const isReplacement = input.id !== undefined;
    const restartsLifetime = !existing.isLimited;
    const entry: LiveNotification = {
      ...existing,
      notification: notificationOf(id, input, isReplacement ? 1 : count + 1),
      name: isReplacement ? (existing.name ?? input.id) : existing.name,
      lifetimeMs: restartsLifetime ? lifetimeOf(input) : existing.lifetimeMs,
    };
    this.live.update((entries) =>
      entries.map((live) => (live.key === entry.key ? entry : live)),
    );
    if (restartsLifetime) {
      this.clock.stop(entry.key);
    }
    this.startLifetimesOfShown();
    return existing.returnedId;
  }

  private remove(key: number): void {
    this.clock.stop(key);
    this.live.update((entries) => entries.filter((live) => live.key !== key));
    if (this.live().length === 0) {
      this.release();
    }
    this.startLifetimesOfShown();
  }

  private liveAs(
    input: NotificationInput,
    raiser: string | undefined,
  ): LiveNotification | undefined {
    return this.live().find(
      (entry) =>
        entry.raiser === raiser &&
        (input.id === undefined
          ? isRepeatOf(entry, input)
          : entry.name === input.id || entry.returnedId === input.id),
    );
  }

  private refuseBeyond(limits: RaiserLimits, raiser: string): void {
    const live = this.live().filter((entry) => entry.raiser === raiser);
    if (live.length >= limits.atOnce) {
      throw new Error(
        `Plugin '${raiser}' already holds ${limits.atOnce} toasts, shown and waiting together. ` +
          'A further one is refused until one of them has left.',
      );
    }
  }

  private takeBack(id: string): void {
    if (!this.isTaken(id)) {
      return;
    }
    const generated = this.generatedId();
    this.live.update((entries) =>
      entries.map((entry) =>
        entry.notification.id === id
          ? { ...entry, notification: { ...entry.notification, id: generated } }
          : entry,
      ),
    );
  }

  private freeIdFor(
    input: NotificationInput,
    raiser: string | undefined,
  ): string {
    if (input.id === undefined) {
      return this.generatedId();
    }
    const wanted = raiser === undefined ? input.id : `${raiser}.${input.id}`;
    return this.isTaken(wanted) ? this.generatedId() : wanted;
  }

  private generatedId(): string {
    let id: string;
    do {
      id = `lw.toast.${this.nextGeneratedId++}`;
    } while (this.isTaken(id));
    return id;
  }

  private isTaken(id: string): boolean {
    return this.live().some((entry) => entry.notification.id === id);
  }

  private startLifetimesOfShown(): void {
    for (const entry of this.live().slice(0, SHOWN_AT_ONCE)) {
      if (entry.lifetimeMs !== STAYS && !this.clock.isTiming(entry.key)) {
        this.clock.start(entry.key, entry.lifetimeMs);
      }
    }
  }
}

function queued(
  entries: readonly LiveNotification[],
  entry: LiveNotification,
): readonly LiveNotification[] {
  if (entry.isLimited) {
    return [...entries, entry];
  }
  const firstToGiveWay = entries.findIndex(
    (live, place) => place >= SHOWN_AT_ONCE && live.isLimited,
  );
  return firstToGiveWay === -1
    ? [...entries, entry]
    : entries.toSpliced(firstToGiveWay, 0, entry);
}

function limitedLifetime(
  lifetimeMs: number,
  limits: RaiserLimits | undefined,
): number {
  if (!limits) {
    return lifetimeMs;
  }
  return lifetimeMs === STAYS
    ? limits.lifetimeMs
    : Math.min(lifetimeMs, limits.lifetimeMs);
}

function notificationOf(
  id: string,
  input: NotificationInput,
  count: number,
): Notification {
  return {
    id,
    kind: input.kind ?? 'info',
    message: input.message,
    icon: input.icon,
    count,
    action: input.action,
  };
}

function isRepeatOf(
  existing: LiveNotification,
  input: NotificationInput,
): boolean {
  const { kind, message, icon, action } = existing.notification;
  return (
    existing.name === undefined &&
    kind === (input.kind ?? 'info') &&
    message === input.message &&
    icon === input.icon &&
    action?.label === input.action?.label
  );
}
