import { upsertById } from '../foundation/identified';
import { Service, signal } from '@angular/core';
import {
  NotificationAction,
  NotificationInput,
  NotificationKind,
} from '@loomweaver/plugin-sdk';

export type {
  NotificationInput,
  NotificationKind,
  NotificationAction,
} from '@loomweaver/plugin-sdk';

/** A live notification held by the service and rendered by the toast outlet. */
export interface Notification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly message: string;
  readonly action?: NotificationAction;
}

/**
 * Neutral host service for transient notifications ("toasts"). The shell
 * renders them once via the toast outlet; distributions and plugins raise them through
 * `ctx`. Sticky toasts (no `timeoutMs`) stay until dismissed — the update notice uses
 * this so dismissing it never loses the "update available" state.
 */
@Service()
export class NotificationService {
  private readonly items = signal<readonly Notification[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  /** The currently visible notifications, oldest first. */
  readonly notifications = this.items.asReadonly();

  /** Shows a notification (replacing any with the same id) and returns its id. */
  show(input: NotificationInput): string {
    const id = input.id ?? `lw.toast.${this.nextId++}`;
    const toast: Notification = {
      id,
      kind: input.kind ?? 'info',
      message: input.message,
      action: input.action,
    };
    this.clearTimer(id);
    this.items.update((list) => upsertById(list, toast));
    if (input.timeoutMs && input.timeoutMs > 0) {
      this.timers.set(
        id,
        setTimeout(() => this.dismiss(id), input.timeoutMs),
      );
    }
    return id;
  }

  /** Removes the notification with the given id (no-op if already gone). */
  dismiss(id: string): void {
    this.clearTimer(id);
    this.items.update((list) => list.filter((t) => t.id !== id));
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}
