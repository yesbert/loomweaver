import { inject, Injector, isDevMode, Service } from '@angular/core';
import { CapabilityError } from '@loomweaver/plugin-sdk';
import { CommandService } from '../commands/command.service';
import { NotificationService } from '../notifications/notification.service';
import { CapabilityGrantService } from './capability-grant.service';
import { OPEN_SETTINGS_COMMAND_ID } from '../commands/host-command-ids';

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
          this.injector.get(CommandService).execute(OPEN_SETTINGS_COMMAND_ID),
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
