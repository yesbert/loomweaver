import { Injector } from '@angular/core';
import { ContributionRegistry } from './plugin/contribution-registry';
import { ViewStateService } from './views/view-state.service';
import { ViewInstanceService } from './views/view-instance.service';
import { ContentTabsService } from './regions/content/tabs/content-tabs.service';
import { registerTabContextMenu } from './regions/content/tabs/tab-context-menu';
import { PaneTreeService } from './regions/pane/tree/pane-tree.service';
import { PaneMoveService } from './regions/pane/drag/pane-move.service';
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
import { FeatureSwitches } from './features/feature-switches.service';
import { whileOn } from './features/while-on';
import { ShellLayout } from './layout/layout';
import {
  hasContentRegion,
  hasRegionOfType,
  sideCount,
} from './layout/layout-queries';

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
  readonly features: FeatureSwitches;
  readonly injector: Injector;
}

export function registerBuiltInMenus(
  registry: ContributionRegistry,
  layout: ShellLayout,
  deps: BuiltInMenuDeps,
): void {
  if (deps.popout.active) {
    return;
  }
  registerTabContextMenu(
    registry,
    deps.tabs,
    deps.paneMove,
    deps.paneTree,
    deps.popout,
    deps.features,
    deps.injector,
  );
  registerRailMenus(registry, layout, deps);
  registerViewMenus(registry, layout, deps);
}

function registerRailMenus(
  registry: ContributionRegistry,
  layout: ShellLayout,
  deps: BuiltInMenuDeps,
): void {
  const rail = deps.features.rail;
  const hasRail = hasRegionOfType(layout, 'rail');
  if (hasRail) {
    whileOn(deps.injector, rail.hideItems, () =>
      registerRailContextMenu(registry, deps.railItems),
    );
  }
  if (sideCount(layout, 'rail') >= 2) {
    whileOn(deps.injector, rail.moveItems, () =>
      registerRailMoveMenu(registry, deps.railMove),
    );
  }
  if (hasRail) {
    whileOn(deps.injector, rail.curate, () =>
      registerRailCustomizeMenu(registry),
    );
  }
}

function registerViewMenus(
  registry: ContributionRegistry,
  layout: ShellLayout,
  deps: BuiltInMenuDeps,
): void {
  const sidebar = deps.features.sidebar;
  whileOn(deps.injector, sidebar.resetViewState, () =>
    registerViewResetMenu(registry, deps.viewStates, deps.viewInstances),
  );
  whileOn(deps.injector, deps.features.windows.popout, () =>
    registerViewPopoutMenu(registry, deps.popout),
  );
  if (sideCount(layout, 'panel') >= 2) {
    whileOn(deps.injector, sidebar.moveViews, () =>
      registerViewContextMenu(registry, deps.viewMove),
    );
  }
  if (!hasRegionOfType(layout, 'panel')) {
    return;
  }
  whileOn(deps.injector, sidebar.curate, () =>
    registerViewCustomizeMenu(registry),
  );
  whileOn(deps.injector, sidebar.hideViews, () =>
    registerViewHideMenu(registry, deps.viewVisibility),
  );
  whileOn(deps.injector, sidebar.stackViews, () =>
    registerViewStackMenu(registry, deps.paneTree),
  );
  if (hasContentRegion(layout)) {
    whileOn(deps.injector, sidebar.openViewInContent, () =>
      registerViewOpenInContentMenu(registry, deps.paneTree),
    );
  }
}
