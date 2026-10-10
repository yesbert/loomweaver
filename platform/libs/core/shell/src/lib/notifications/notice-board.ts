import { computed, Service, signal } from '@angular/core';
import {
  NotificationAction,
  NotificationInput,
  NotificationKind,
} from '@loomweaver/plugin-sdk';
import { upsertBy } from '../foundation/identified';
import { LifetimeClock } from './lifetime-clock';
import { HOLD_REMAINDER_MS, lifetimeOf, STAYS } from './notice-lifetime';

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

interface LiveNotice {
  readonly notification: Notification;
  readonly raiser: string | undefined;
  readonly lifetimeMs: number;
  readonly named: boolean;
}

export const SHOWN_AT_ONCE = 3;

@Service()
export class NoticeBoard {
  private readonly live = signal<readonly LiveNotice[]>([]);
  private readonly clock = new LifetimeClock((id) => this.dismiss(id));
  private nextId = 0;

  readonly shown = computed<readonly Notification[]>(() =>
    this.live()
      .slice(0, SHOWN_AT_ONCE)
      .map((notice) => notice.notification),
  );

  raise(input: NotificationInput, raiser?: string): string {
    const held = this.heldAs(input, raiser);
    const notice = held
      ? this.raisedAgain(held, input)
      : this.raisedFirst(input, raiser);
    const id = notice.notification.id;
    this.live.update((notices) =>
      upsertBy(notices, notice, (other) => other.notification.id === id),
    );
    this.clock.stop(id);
    this.startLifetimesOfShown();
    return id;
  }

  dismiss(id: string): void {
    this.clock.stop(id);
    this.live.update((notices) =>
      notices.filter((notice) => notice.notification.id !== id),
    );
    if (this.live().length === 0) {
      this.release();
    }
    this.startLifetimesOfShown();
  }

  hold(): void {
    this.clock.hold();
  }

  release(): void {
    this.clock.release(HOLD_REMAINDER_MS);
  }

  heldAfter(input: NotificationInput, raiser: string): number {
    const held = this.live().filter((notice) => notice.raiser === raiser);
    return held.length + (this.heldAs(input, raiser) ? 0 : 1);
  }

  private heldAs(
    input: NotificationInput,
    raiser: string | undefined,
  ): LiveNotice | undefined {
    const id = namedId(input, raiser);
    return this.live().find((notice) =>
      id === undefined
        ? repeats(notice, input, raiser)
        : notice.notification.id === id,
    );
  }

  private raisedFirst(
    input: NotificationInput,
    raiser: string | undefined,
  ): LiveNotice {
    const id = namedId(input, raiser) ?? `lw.toast.${this.nextId++}`;
    return {
      notification: notificationOf(id, input, 1),
      raiser,
      lifetimeMs: lifetimeOf(input),
      named: input.id !== undefined,
    };
  }

  private raisedAgain(held: LiveNotice, input: NotificationInput): LiveNotice {
    const { id, count } = held.notification;
    const named = input.id !== undefined;
    return {
      ...held,
      notification: notificationOf(id, input, named ? 1 : count + 1),
      lifetimeMs: lifetimeOf(input),
      named,
    };
  }

  private startLifetimesOfShown(): void {
    for (const notice of this.live().slice(0, SHOWN_AT_ONCE)) {
      const id = notice.notification.id;
      if (notice.lifetimeMs !== STAYS && !this.clock.counts(id)) {
        this.clock.start(id, notice.lifetimeMs);
      }
    }
  }
}

function namedId(
  input: NotificationInput,
  raiser: string | undefined,
): string | undefined {
  if (input.id === undefined || raiser === undefined) {
    return input.id;
  }
  return `${raiser}.${input.id}`;
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

function repeats(
  held: LiveNotice,
  input: NotificationInput,
  raiser: string | undefined,
): boolean {
  const { kind, message, icon, action } = held.notification;
  return (
    !held.named &&
    held.raiser === raiser &&
    kind === (input.kind ?? 'info') &&
    message === input.message &&
    icon === input.icon &&
    action?.label === input.action?.label
  );
}
