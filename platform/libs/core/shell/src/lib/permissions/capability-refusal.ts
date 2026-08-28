import { ErrorHandler, inject, Injectable, Injector, Service } from '@angular/core';
import { CapabilityError } from '@loomweaver/plugin-sdk';
import { CommandService } from '../commands/command.service';
import { NotificationService } from '../notifications/notification.service';

@Service()
export class CapabilityRefusalReporter {
  private readonly notifications = inject(NotificationService);
  private readonly injector = inject(Injector);

  report(error: unknown): boolean {
    if (!(error instanceof CapabilityError)) {
      return false;
    }
    this.notifications.show({
      id: 'permission-blocked',
      kind: 'warning',
      message: 'permission.blocked',
      timeoutMs: 8000,
      action: {
        label: 'permission.openSettings',
        run: () =>
          this.injector.get(CommandService).execute('shell.openSettings'),
      },
    });
    return true;
  }
}

@Injectable()
export class ShellErrorHandler extends ErrorHandler {
  private readonly refusals = inject(CapabilityRefusalReporter);

  override handleError(error: unknown): void {
    if (this.refusals.report(error)) {
      return;
    }
    super.handleError(error);
  }
}
