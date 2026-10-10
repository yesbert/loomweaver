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
  readonly lifetimeMs: number;
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
    const limits = raiser === undefined ? undefined : this.limits.get(raiser);
    const existing = this.liveAs(input, raiser);
    const entry = existing
      ? shownAgain(existing, input, limits)
      : this.shownFirst(input, raiser, limits);
    this.live.update((entries) => replacedOrAppended(entries, entry));
    if (!(existing && limits)) {
      this.clock.stop(entry.key);
    }
    this.startLifetimesOfShown();
    return entry.notification.id;
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
          : entry.name === input.id || entry.notification.id === input.id),
    );
  }

  private shownFirst(
    input: NotificationInput,
    raiser: string | undefined,
    limits: RaiserLimits | undefined,
  ): LiveNotification {
    this.refuseBeyond(limits, raiser);
    return {
      key: this.nextKey++,
      notification: notificationOf(this.idFor(input, raiser), input, 1),
      raiser,
      name: input.id,
      lifetimeMs: limitedLifetime(lifetimeOf(input), limits),
    };
  }

  private refuseBeyond(
    limits: RaiserLimits | undefined,
    raiser: string | undefined,
  ): void {
    const live = this.live().filter((entry) => entry.raiser === raiser);
    if (limits && live.length >= limits.atOnce) {
      throw new Error(
        `Plugin '${raiser}' already holds ${limits.atOnce} toasts, shown and waiting together. ` +
          'A further one is refused until one of them has left.',
      );
    }
  }

  private idFor(input: NotificationInput, raiser: string | undefined): string {
    if (input.id === undefined) {
      return this.generatedId();
    }
    if (raiser === undefined) {
      this.vacate(input.id);
      return input.id;
    }
    const joined = `${raiser}.${input.id}`;
    return this.isTaken(joined) ? this.generatedId() : joined;
  }

  private vacate(id: string): void {
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

function shownAgain(
  existing: LiveNotification,
  input: NotificationInput,
  limits: RaiserLimits | undefined,
): LiveNotification {
  const { id, count } = existing.notification;
  const isReplacement = input.id !== undefined;
  return {
    ...existing,
    notification: notificationOf(id, input, isReplacement ? 1 : count + 1),
    name: isReplacement ? (existing.name ?? input.id) : existing.name,
    lifetimeMs: limits ? existing.lifetimeMs : lifetimeOf(input),
  };
}

function replacedOrAppended(
  entries: readonly LiveNotification[],
  entry: LiveNotification,
): readonly LiveNotification[] {
  return entries.some((live) => live.key === entry.key)
    ? entries.map((live) => (live.key === entry.key ? entry : live))
    : [...entries, entry];
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
