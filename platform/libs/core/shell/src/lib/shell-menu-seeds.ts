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
import { ShellRegions } from './shell-seeds';

function docks(layout: ShellRegions, type: string): number {
  return new Set(
    layout.regions
      .filter((region) => region.type === type)
      .map((region) => region.dock),
  ).size;
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
  readonly features: FeatureSwitches;
  readonly injector: Injector;
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
    deps.injector,
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
  if (railCount >= 1) {
    whileOn(deps.injector, rail.hideItems, () =>
      registerRailContextMenu(registry, deps.railItems),
    );
  }
  if (docks(layout, 'rail') >= 2) {
    whileOn(deps.injector, rail.moveItems, () =>
      registerRailMoveMenu(registry, deps.railMove),
    );
  }
  if (railCount >= 1) {
    whileOn(deps.injector, rail.curate, () =>
      registerRailCustomizeMenu(registry),
    );
  }
}

function seedViewMenus(
  registry: ContributionRegistry,
  layout: ShellRegions,
  deps: BuiltInMenuDeps,
): void {
  const sidebar = deps.features.sidebar;
  whileOn(deps.injector, sidebar.resetViewState, () =>
    registerViewResetMenu(registry, deps.viewStates, deps.viewInstances),
  );
  whileOn(deps.injector, deps.features.windows.popout, () =>
    registerViewPopoutMenu(registry, deps.popout),
  );
  const panelCount = layout.regions.filter(
    (region) => region.type === 'panel',
  ).length;
  if (docks(layout, 'panel') >= 2) {
    whileOn(deps.injector, sidebar.moveViews, () =>
      registerViewContextMenu(registry, deps.viewMove),
    );
  }
  if (panelCount === 0) {
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
  if (layout.regions.some((region) => region.type === 'content')) {
    whileOn(deps.injector, sidebar.openViewInContent, () =>
      registerViewOpenInContentMenu(registry, deps.paneTree),
    );
  }
}
