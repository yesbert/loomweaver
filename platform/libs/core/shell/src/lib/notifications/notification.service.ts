import { inject, Service } from '@angular/core';
import { NotificationInput } from '@loomweaver/plugin-sdk';
import { NoticeBoard } from './notice-board';

export type {
  NotificationInput,
  NotificationKind,
  NotificationAction,
} from '@loomweaver/plugin-sdk';
export type { Notification } from './notice-board';

/**
 * Neutral host service for transient notifications ("toasts"). The shell renders them once via
 * the toast outlet; distributions and plugins raise them through `ctx`.
 *
 * A toast leaves by itself unless it is an `error` or states `timeoutMs: 0`, at most three are
 * shown at once while the rest wait their turn, and the same toast raised again without an id is
 * counted on the one already there. All of that is decided here and not by the outlet, so it holds
 * for a distribution that draws the toasts itself (`provideShell({ drawToasts: false })`).
 */
@Service()
export class NotificationService {
  private readonly board = inject(NoticeBoard);

  /**
   * The notifications to show now, oldest first. Never more than three: a further one waits and
   * appears here when one of these leaves or is dismissed, and its lifetime starts only then.
   */
  readonly notifications = this.board.shown;

  /**
   * Shows a notification and returns its id. With an `id` it replaces the notification of that id;
   * without one, the same notification raised again is counted on the one still there.
   */
  show(input: NotificationInput): string {
    return this.board.raise(input);
  }

  /** Removes the notification with the given id (no-op if already gone). */
  dismiss(id: string): void {
    this.board.dismiss(id);
  }

  /**
   * Says the user is attending to the notifications: none leaves by itself until
   * {@link release}. The toast outlet calls it when the pointer moves on a toast or keyboard focus
   * enters one; a distribution that draws the toasts itself calls it for the same moments. Calling it
   * twice is the same as calling it once.
   */
  hold(): void {
    this.board.hold();
  }

  /**
   * Ends {@link hold}. Every notification runs what was left of its lifetime, and at least a
   * second, so that none vanishes the moment the pointer leaves. Dismissing the last notification
   * ends a hold too.
   */
  release(): void {
    this.board.release();
  }
}
