import { TranslocoService } from '@jsverse/transloco';
import { AuthContext } from './auth/auth-context';
import { ContributionRegistry } from './plugin/contribution-registry';
import { DialogService } from './dialog/dialog.service';
import { SettingsService } from './settings/settings.service';
import { WorkspaceService } from './workspace/workspace.service';
import { ViewStateService } from './views/view-state.service';
import { ViewInstanceService } from './views/view-instance.service';
import {
  CommandPalette,
  PALETTE_COMMAND_ID,
  QUICK_OPEN_COMMAND_ID,
} from './commands/command-palette';
import { WorkspaceDialog } from './workspace/workspace-dialog';
import { ContentTabsService } from './regions/content/tabs/content-tabs.service';
import { offRouterMountable } from './regions/content/pane-targets';
import { registerTabContextMenu } from './regions/content/tabs/tab-context-menu';
import { CONTENT_DOCK } from './regions/pane/tree/pane-address';
import { PaneTreeService } from './regions/pane/tree/pane-tree.service';
import { PaneMoveService } from './regions/pane/drag/pane-move.service';
import { RetentionCandidates } from './regions/pane/retention/retention-candidates';
import { SurfaceCloseGuard } from './regions/pane/close/surface-close-guard';
import {
  registerViewContextMenu,
  registerViewHideMenu,
  registerViewStackMenu,
  registerViewOpenInContentMenu,
  registerViewPopoutMenu,
  registerViewResetMenu,
  registerViewCustomizeMenu,
} from './regions/panel/view-context-menu';
import { ViewMoveService } from './regions/panel/view-move.service';
import {
  registerRailContextMenu,
  registerRailCustomizeMenu,
  registerRailMoveMenu,
} from './regions/rail/rail-context-menu';
import { RailItemsService } from './regions/rail/rail-items.service';
import { RailMoveService } from './regions/rail/rail-move.service';
import { ViewVisibilityService } from './regions/panel/view-visibility.service';
import { PopoutService } from './popout/popout.service';
import { ShellFeatures } from './foundation/shell-features';
import {
  CURATION_CHROME,
  CurationDialog,
} from './regions/curation/curation-dialog';
import { AppResetService } from './layout/app-reset.service';

export interface ShellRegions {
  readonly regions: readonly {
    readonly type: string;
    readonly dock?: string;
  }[];
}

function hasRegion(layout: ShellRegions, type: string): boolean {
  return layout.regions.some((region) => region.type === type);
}

function docks(layout: ShellRegions, type: string): number {
  return new Set(
    layout.regions
      .filter((region) => region.type === type)
      .map((region) => region.dock),
  ).size;
}

export interface HostCommandDeps {
  readonly dialogs: DialogService;
  readonly paneTree: PaneTreeService;
  readonly tabs: ContentTabsService;
  readonly workspace: WorkspaceService;
  readonly transloco: TranslocoService;
  readonly settings: SettingsService;
  readonly popout: PopoutService;
  readonly auth: AuthContext;
  readonly closeGuard: SurfaceCloseGuard;
  readonly retention: RetentionCandidates;
  readonly appReset: AppResetService;
  readonly features: ShellFeatures;
}

export interface BuiltInMenuDeps {
  readonly tabs: ContentTabsService;
  readonly paneMove: PaneMoveService;
  readonly viewMove: ViewMoveService;
  readonly viewVisibility: ViewVisibilityService;
  readonly railItems: RailItemsService;
  readonly railMove: RailMoveService;
  readonly paneTree: PaneTreeService;
  readonly viewStates: ViewStateService;
  readonly viewInstances: ViewInstanceService;
  readonly popout: PopoutService;
  readonly features: ShellFeatures;
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
  layout: ShellRegions,
  deps: HostCommandDeps,
): void {
  const {
    dialogs,
    paneTree,
    tabs,
    workspace,
    transloco,
    settings,
    popout,
    auth,
    closeGuard,
    retention,
    appReset,
    features,
  } = deps;
  registry.addCommand({
    id: PALETTE_COMMAND_ID,
    title: 'palette.title',
    icon: 'search',
    shortcut: 'mod+k',
    popout: true,
    run: () => {
      dialogs.open(CommandPalette, { bare: true, size: 'lg', align: 'top' });
    },
  });
  registry.addCommand({
    id: 'shell.openSettings',
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
        data: { mode: 'tabs' },
      });
    },
  });
  if (features.rail.curate && hasRegion(layout, 'rail')) {
    registry.addCommand({
      id: 'shell.rail.customize',
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
    });
  }
  if (features.sidebar.curate && hasRegion(layout, 'panel')) {
    registry.addCommand({
      id: 'shell.views.customize',
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
    });
  }
  registry.addCommand({
    id: 'shell.app.reset',
    title: 'appReset.title',
    icon: 'undo',
    run: () => {
      void dialogs
        .confirm({
          title: transloco.translate('appReset.title'),
          message: transloco.translate('appReset.confirm'),
        })
        .then(async (ok) => {
          if (!ok) {
            return;
          }
          if (await closeGuard.confirmDiscard(retention.all())) {
            appReset.reset();
          }
        });
    },
  });
  if (features.content.splitRight) {
    registry.addCommand({
      id: 'shell.content.splitRight',
      title: 'content.split.open',
      icon: 'splitPanes',
      shortcut: 'mod+\\',
      run: () => {
        if (paneTree.isSplit(CONTENT_DOCK)) {
          paneTree.unsplit(CONTENT_DOCK);
        } else if (offRouterMountable(registry, auth, tabs.activeTabRoot())) {
          paneTree.splitPane(
            CONTENT_DOCK,
            paneTree.primaryId(CONTENT_DOCK),
            'row',
            tabs.activeTabRoot(),
          );
        }
      },
    });
  }
  if (!features.workspaces.enabled) {
    return;
  }
  registry.addCommand({
    id: 'shell.workspace.manage',
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
  });
  registry.addCommand({
    id: 'shell.workspace.reset',
    title: 'workspace.reset',
    icon: 'undo',
    run: () => {
      void dialogs
        .confirm({
          title: transloco.translate('workspace.reset'),
          message: transloco.translate('workspace.resetConfirm'),
        })
        .then(async (ok) => {
          if (!ok) {
            return;
          }
          if (await closeGuard.confirmDiscard(retention.all())) {
            workspace.reset();
          }
        });
    },
  });
}

export function seedBuiltInMenus(
  registry: ContributionRegistry,
  layout: ShellRegions,
  deps: BuiltInMenuDeps,
): void {
  if (deps.popout.active) {
    return;
  }
  registerTabContextMenu(
    registry,
    deps.tabs,
    deps.paneMove,
    deps.popout,
    deps.features,
  );
  seedRailMenus(registry, layout, deps);
  seedViewMenus(registry, layout, deps);
}

function seedRailMenus(
  registry: ContributionRegistry,
  layout: ShellRegions,
  deps: BuiltInMenuDeps,
): void {
  const railCount = layout.regions.filter(
    (region) => region.type === 'rail',
  ).length;
  const rail = deps.features.rail;
  if (railCount >= 1 && rail.hideItems) {
    registerRailContextMenu(registry, deps.railItems);
  }
  if (docks(layout, 'rail') >= 2 && rail.moveItems) {
    registerRailMoveMenu(registry, deps.railMove);
  }
  if (railCount >= 1 && rail.curate) {
    registerRailCustomizeMenu(registry);
  }
}

function seedViewMenus(
  registry: ContributionRegistry,
  layout: ShellRegions,
  deps: BuiltInMenuDeps,
): void {
  const sidebar = deps.features.sidebar;
  if (sidebar.resetViewState) {
    registerViewResetMenu(registry, deps.viewStates, deps.viewInstances);
  }
  if (deps.features.windows.popout) {
    registerViewPopoutMenu(registry, deps.popout);
  }
  const panelCount = layout.regions.filter(
    (region) => region.type === 'panel',
  ).length;
  if (docks(layout, 'panel') >= 2 && sidebar.moveViews) {
    registerViewContextMenu(registry, deps.viewMove);
  }
  if (panelCount === 0) {
    return;
  }
  if (sidebar.curate) {
    registerViewCustomizeMenu(registry);
  }
  if (sidebar.hideViews) {
    registerViewHideMenu(registry, deps.viewVisibility);
  }
  if (sidebar.stackViews) {
    registerViewStackMenu(registry, deps.paneTree);
  }
  if (
    sidebar.openViewInContent &&
    layout.regions.some((region) => region.type === 'content')
  ) {
    registerViewOpenInContentMenu(registry, deps.paneTree);
  }
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
