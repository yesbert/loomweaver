import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LwButton } from '../elements/button/lw-button';
import { LoomIconName } from '../elements/icon/loom-icons';
import {
  Notification,
  NotificationKind,
  NotificationService,
} from './notification.service';

/**
 * Renders the active notifications as toasts in a fixed corner. Mounted once
 * by the shell root, so every distribution gets it for free. Each toast shows its kind
 * icon, message, an optional action button and a dismiss control. The kind selects the
 * icon; a feedback-colour token ladder can be added later if toasts grow richer.
 */
@Component({
  selector: 'lw-toasts',
  imports: [TranslocoPipe, LwButton],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './toast-outlet.html',
})
export class ToastOutlet {
  private readonly service = inject(NotificationService);
  protected readonly notifications = this.service.notifications;

  private readonly icons: Record<NotificationKind, LoomIconName> = {
    info: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
  };

  private readonly iconColors: Record<NotificationKind, string> = {
    info: 'text-info',
    success: 'text-positive',
    warning: 'text-caution',
    error: 'text-negative',
  };

  protected iconFor(kind: NotificationKind): LoomIconName {
    return this.icons[kind];
  }

  protected iconColorFor(kind: NotificationKind): string {
    return this.iconColors[kind];
  }

  protected roleFor(kind: NotificationKind): 'alert' | 'status' {
    return kind === 'error' || kind === 'warning' ? 'alert' : 'status';
  }

  protected runAction(toast: Notification): void {
    toast.action?.run();
    this.service.dismiss(toast.id);
  }

  protected dismiss(id: string): void {
    this.service.dismiss(id);
  }
}
