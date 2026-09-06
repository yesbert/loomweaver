import {
  ErrorHandler,
  inject,
  Injectable,
  Injector,
  isDevMode,
  Service,
} from '@angular/core';
import { CapabilityError } from '@loomweaver/plugin-sdk';
import { CommandService } from '../commands/command.service';
import { NotificationService } from '../notifications/notification.service';
import { CapabilityGrantService } from './capability-grant.service';

@Service()
export class CapabilityRefusalReporter {
  private readonly notifications = inject(NotificationService);
  private readonly grants = inject(CapabilityGrantService);
  private readonly injector = inject(Injector);

  report(error: unknown): boolean {
    if (!(error instanceof CapabilityError)) {
      return false;
    }
    if (this.grants.isBaseGranted(error.pluginId, error.capability)) {
      this.reportRevocation();
    } else {
      this.reportMissingGrant(error);
    }
    return true;
  }

  private reportRevocation(): void {
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
  }

  private reportMissingGrant(error: CapabilityError): void {
    if (isDevMode()) {
      console.error(error.message);
    }
    this.notifications.show({
      id: 'permission-blocked',
      kind: 'warning',
      message: 'permission.unavailable',
      timeoutMs: 8000,
    });
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
