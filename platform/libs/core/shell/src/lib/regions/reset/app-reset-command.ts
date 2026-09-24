import { TranslocoService } from '@jsverse/transloco';
import { Disposable } from '@loomweaver/plugin-sdk';
import { APP_RESET_COMMAND_ID } from '../../commands/host-command-ids';
import { DialogService } from '../../dialog/dialog.service';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { AppResetChoice, AppResetDialog } from './app-reset-dialog';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { AppResetService } from './app-reset.service';

export interface AppResetCommandDeps {
  readonly dialogs: DialogService;
  readonly transloco: TranslocoService;
  readonly features: FeatureSwitches;
  readonly appReset: AppResetService;
}

export function registerAppResetCommand(
  registry: ContributionRegistry,
  { dialogs, transloco, features, appReset }: AppResetCommandDeps,
): Disposable {
  return registry.addCommand({
    id: APP_RESET_COMMAND_ID,
    title: 'appReset.title',
    icon: 'undo',
    run: () => {
      const ref = dialogs.open<AppResetChoice>(AppResetDialog, {
        size: 'md',
        title: transloco.translate('appReset.title'),
        icon: 'undo',
        data: { workspaces: features.workspaces.enabled() },
      });
      void ref.closed.then(async (choice) => {
        if (choice === undefined) {
          return;
        }
        await appReset.reset({ workspaces: choice.workspaces });
      });
    },
  });
}
