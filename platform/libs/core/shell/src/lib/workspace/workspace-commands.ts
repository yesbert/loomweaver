import { TranslocoService } from '@jsverse/transloco';
import { Disposable } from '@loomweaver/plugin-sdk';
import {
  WORKSPACE_MANAGE_COMMAND_ID,
  WORKSPACE_RESET_COMMAND_ID,
} from '../commands/host-command-ids';
import { DialogService } from '../dialog/dialog.service';
import { menuContextString } from '../menu/menu-context';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { disposeTogether } from '../plugin/dispose-together';
import { WorkspaceDialog } from './workspace-dialog';
import { WorkspaceService } from './workspace.service';

export interface WorkspaceCommandDeps {
  readonly dialogs: DialogService;
  readonly transloco: TranslocoService;
  readonly workspace: WorkspaceService;
}

export function registerWorkspaceCommands(
  registry: ContributionRegistry,
  { dialogs, transloco, workspace }: WorkspaceCommandDeps,
): Disposable {
  return disposeTogether([
    registry.addCommand({
      id: WORKSPACE_MANAGE_COMMAND_ID,
      title: 'workspace.title',
      icon: 'workspaces',
      run: () => {
        dialogs.open(WorkspaceDialog, {
          size: 'md',
          align: 'top',
          title: 'workspace.title',
          icon: 'workspaces',
        });
      },
    }),
    registry.addCommand({
      id: WORKSPACE_RESET_COMMAND_ID,
      title: 'workspace.reset',
      icon: 'undo',
      run: (context) => {
        const named = menuContextString(context, 'workspace');
        void dialogs
          .confirm({
            title: transloco.translate('workspace.reset'),
            message: transloco.translate('workspace.resetConfirm'),
          })
          .then((ok) => {
            if (ok) {
              void workspace.reset(named === '' ? undefined : named);
            }
          });
      },
    }),
  ]);
}
