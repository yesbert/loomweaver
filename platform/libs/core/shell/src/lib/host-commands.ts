import { Injector } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ContributionRegistry } from './contributions/contribution-registry';
import { DialogService } from './dialog/dialog.service';
import { SettingsService } from './settings-dialog/settings.service';
import { registerOpenSettingsCommand } from './settings-dialog/settings-command';
import { WorkspaceService } from './workspace/workspace.service';
import { registerWorkspaceCommands } from './workspace/workspace-commands';
import {
  registerPaletteCommand,
  registerQuickOpenCommand,
} from './commands/palette-commands';
import { PaneService } from './regions/pane/pane.service';
import { registerSplitCommand } from './regions/pane/split-command';
import { PopoutService } from './popout/popout.service';
import { FeatureSwitches } from './features/feature-switches.service';
import { whileOn } from './features/while-on';
import {
  registerRailCurationCommand,
  registerViewsCurationCommand,
} from './regions/curation/curation-commands';
import { AppResetService } from './regions/reset/app-reset.service';
import { registerAppResetCommand } from './regions/reset/app-reset-command';
import { ShellLayout } from './layout/layout';
import { hasRegionOfType } from './layout/layout-queries';

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

export function registerHostCommands(
  registry: ContributionRegistry,
  layout: ShellLayout,
  deps: HostCommandDeps,
): void {
  const { dialogs, features, injector } = deps;
  registerPaletteCommand(registry, dialogs);
  registerOpenSettingsCommand(registry, deps.settings);
  if (deps.popout.active) {
    return;
  }
  registerQuickOpenCommand(registry, dialogs);
  if (hasRegionOfType(layout, 'rail')) {
    whileOn(injector, features.rail.curate, () =>
      registerRailCurationCommand(registry, dialogs),
    );
  }
  if (hasRegionOfType(layout, 'panel')) {
    whileOn(injector, features.sidebar.curate, () =>
      registerViewsCurationCommand(registry, dialogs),
    );
  }
  registerAppResetCommand(registry, deps);
  whileOn(injector, features.content.splitRight, () =>
    registerSplitCommand(registry, deps.panes),
  );
  whileOn(injector, features.workspaces.enabled, () =>
    registerWorkspaceCommands(registry, deps),
  );
}
