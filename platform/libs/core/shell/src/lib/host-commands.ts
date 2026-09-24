import { Injector } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ContributionRegistry } from './plugin/contribution-registry';
import { DialogService } from './dialog/dialog.service';
import { SettingsService } from './settings/settings.service';
import { WorkspaceService } from './workspace/workspace.service';
import {
  CommandPalette,
  PALETTE_COMMAND_ID,
  QUICK_OPEN_COMMAND_ID,
} from './commands/command-palette';
import { WorkspaceDialog } from './workspace/workspace-dialog';
import { PaneService } from './regions/pane/pane.service';
import { PopoutService } from './popout/popout.service';
import { FeatureSwitches } from './features/feature-switches.service';
import { whileOn } from './features/while-on';
import { disposeTogether } from './plugin/dispose-together';
import {
  CURATION_CHROME,
  CurationDialog,
} from './regions/curation/curation-dialog';
import { AppResetService } from './regions/reset/app-reset.service';
import { AppResetChoice, AppResetDialog } from './layout/app-reset-dialog';
import { menuContextString } from './menu/menu-context';
import { ShellLayout } from './layout/layout';
import { hasRegionOfType } from './layout/layout-queries';
import {
  APP_RESET_COMMAND_ID,
  OPEN_SETTINGS_COMMAND_ID,
  RAIL_CUSTOMIZE_COMMAND_ID,
  VIEWS_CUSTOMIZE_COMMAND_ID,
  WORKSPACE_MANAGE_COMMAND_ID,
  WORKSPACE_RESET_COMMAND_ID,
} from './commands/host-command-ids';

const CONTENT_SPLIT_RIGHT_COMMAND_ID = 'shell.content.splitRight';

export interface HostCommandDeps {
  readonly dialogs: DialogService;
  readonly panes: PaneService;
  readonly workspace: WorkspaceService;
  readonly transloco: TranslocoService;
  readonly settings: SettingsService;
  readonly popout: PopoutService;
  readonly appReset: AppResetService;
  readonly features: FeatureSwitches;
  readonly injector: Injector;
}

export interface SeedInput {
  readonly views: readonly Parameters<ContributionRegistry['addView']>[0][];
  readonly barItems: readonly Parameters<
    ContributionRegistry['addBarItem']
  >[0][];
  readonly railItems: readonly Parameters<
    ContributionRegistry['addRailItem']
  >[0][];
  readonly omit: readonly string[];
}

export function seedHostCommands(
  registry: ContributionRegistry,
  layout: ShellLayout,
  deps: HostCommandDeps,
): void {
  const {
    dialogs,
    panes,
    workspace,
    transloco,
    settings,
    popout,
    appReset,
    features,
    injector,
  } = deps;
  registry.addCommand({
    id: PALETTE_COMMAND_ID,
    title: 'palette.title',
    icon: 'search',
    shortcut: 'mod+k',
    popout: true,
    run: () => {
      dialogs.open(CommandPalette, {
        bare: true,
        size: 'lg',
        align: 'top',
        title: 'palette.title',
      });
    },
  });
  registry.addCommand({
    id: OPEN_SETTINGS_COMMAND_ID,
    title: 'settings.title',
    icon: 'settings',
    popout: true,
    run: () => {
      settings.open();
    },
  });
  if (popout.active) {
    return;
  }
  registry.addCommand({
    id: QUICK_OPEN_COMMAND_ID,
    title: 'palette.quickOpenTitle',
    icon: 'openWork',
    shortcut: 'mod+p',
    run: () => {
      dialogs.open(CommandPalette, {
        bare: true,
        size: 'lg',
        align: 'top',
        title: 'palette.quickOpenTitle',
        data: { mode: 'tabs' },
      });
    },
  });
  if (hasRegionOfType(layout, 'rail')) {
    whileOn(injector, features.rail.curate, () =>
      registry.addCommand({
        id: RAIL_CUSTOMIZE_COMMAND_ID,
        title: CURATION_CHROME.rail.title,
        icon: CURATION_CHROME.rail.icon,
        run: () => {
          dialogs.open(CurationDialog, {
            bare: true,
            size: 'lg',
            align: 'top',
            title: CURATION_CHROME.rail.title,
            data: { kind: 'rail' },
          });
        },
      }),
    );
  }
  if (hasRegionOfType(layout, 'panel')) {
    whileOn(injector, features.sidebar.curate, () =>
      registry.addCommand({
        id: VIEWS_CUSTOMIZE_COMMAND_ID,
        title: CURATION_CHROME.views.title,
        icon: CURATION_CHROME.views.icon,
        run: () => {
          dialogs.open(CurationDialog, {
            bare: true,
            size: 'lg',
            align: 'top',
            title: CURATION_CHROME.views.title,
            data: { kind: 'views' },
          });
        },
      }),
    );
  }
  registry.addCommand({
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
  whileOn(injector, features.content.splitRight, () =>
    registry.addCommand({
      id: CONTENT_SPLIT_RIGHT_COMMAND_ID,
      title: 'content.split.open',
      icon: 'splitPanes',
      shortcut: 'mod+\\',
      run: () => {
        if (panes.isSplit()) {
          panes.unsplit();
          return;
        }
        panes.splitRight();
      },
    }),
  );
  whileOn(injector, features.workspaces.enabled, () =>
    disposeTogether([
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
    ]),
  );
}

export function seedContributions(
  registry: ContributionRegistry,
  input: SeedInput,
): void {
  for (const view of input.views) {
    registry.addView(view);
  }
  for (const item of input.barItems) {
    registry.addBarItem(item);
  }
  for (const item of input.railItems) {
    registry.addRailItem(item);
  }
  registry.omit(input.omit);
}
