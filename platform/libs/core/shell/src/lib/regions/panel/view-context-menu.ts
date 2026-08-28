import { ContributionRegistry } from '../../plugin/contribution-registry';
import { ViewMoveService } from './view-move.service';
import { ViewVisibilityService } from './view-visibility.service';
import { VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { CONTENT_DOCK } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { menuContextString } from '../../menu/menu-context';
import { ViewStateService } from '../../views/view-state.service';
import { ViewInstanceService } from '../../views/view-instance.service';
import { PopoutService } from '../../popout/popout.service';

export const VIEW_CONTEXT_MENU = 'panel/view/context';

export const PANEL_STRIP_CONTEXT_MENU = 'panel/strip/context';

export function registerViewCustomizeMenu(
  registry: ContributionRegistry,
): void {
  registry.addMenuItem({
    id: 'menu:shell.views.customize',
    menu: PANEL_STRIP_CONTEXT_MENU,
    command: 'shell.views.customize',
    group: '9_customize',
    order: 0,
  });
}

export function registerViewContextMenu(
  registry: ContributionRegistry,
  moves: ViewMoveService,
): void {
  registry.addCommand({
    id: 'shell.view.moveToOtherSidebar',
    paletteHidden: true,
    title: 'panel.viewMenu.moveToOtherSidebar',
    run: (context) => {
      const viewId = menuContextString(context, 'viewId');
      const target = moves.otherPanel(menuContextString(context, 'region'));
      if (viewId && target) {
        moves.move(viewId, target);
      }
    },
  });
  registry.addMenuItem({
    id: 'menu:shell.view.moveToOtherSidebar',
    menu: VIEW_CONTEXT_MENU,
    command: 'shell.view.moveToOtherSidebar',
    group: '1_move',
    order: 0,
  });
}

export function registerViewStackMenu(
  registry: ContributionRegistry,
  paneTree: PaneTreeService,
): void {
  registry.addCommand({
    id: 'shell.view.stackBelow',
    paletteHidden: true,
    title: 'panel.viewMenu.stackBelow',
    run: (context) => {
      const viewId = menuContextString(context, 'viewId');
      const region = menuContextString(context, 'region');
      if (viewId && region) {
        paneTree.setActiveTab(
          region,
          paneTree.primaryId(region),
          VIEW_PANE_PREFIX + viewId,
        );
        paneTree.stackView(region, viewId);
      }
    },
  });
  registry.addMenuItem({
    id: 'menu:shell.view.stackBelow',
    menu: VIEW_CONTEXT_MENU,
    command: 'shell.view.stackBelow',
    group: '2_stack',
    order: 0,
  });
}

export function registerViewResetMenu(
  registry: ContributionRegistry,
  viewStates: ViewStateService,
  viewInstances: ViewInstanceService,
): void {
  registry.addCommand({
    id: 'shell.view.resetState',
    paletteHidden: true,
    title: 'panel.viewMenu.resetState',
    icon: 'undo',
    run: (context) => {
      const viewId = menuContextString(context, 'viewId');
      if (!viewId) {
        return;
      }
      const instance =
        menuContextString(context, 'instance') ||
        viewInstances.activeId(viewId)();
      viewStates.reset(instance);
    },
  });
  registry.addMenuItem({
    id: 'menu:shell.view.resetState',
    menu: VIEW_CONTEXT_MENU,
    command: 'shell.view.resetState',
    group: '3_state',
    order: 0,
  });
}

export function registerViewOpenInContentMenu(
  registry: ContributionRegistry,
  paneTree: PaneTreeService,
): void {
  registry.addCommand({
    id: 'shell.view.openInContent',
    paletteHidden: true,
    title: 'panel.viewMenu.openInContent',
    run: (context) => {
      const viewId = menuContextString(context, 'viewId');
      if (viewId) {
        paneTree.splitPane(
          CONTENT_DOCK,
          paneTree.primaryId(CONTENT_DOCK),
          'row',
          VIEW_PANE_PREFIX + viewId,
        );
      }
    },
  });
  registry.addMenuItem({
    id: 'menu:shell.view.openInContent',
    menu: VIEW_CONTEXT_MENU,
    command: 'shell.view.openInContent',
    group: '2_stack',
    order: 1,
  });
}

export function registerViewHideMenu(
  registry: ContributionRegistry,
  visibility: ViewVisibilityService,
): void {
  registry.addCommand({
    id: 'shell.view.hide',
    paletteHidden: true,
    title: 'panel.viewMenu.hide',
    run: (context) => {
      const viewId = menuContextString(context, 'viewId');
      if (viewId) {
        visibility.hide(viewId);
      }
    },
  });
  registry.addMenuItem({
    id: 'menu:shell.view.hide',
    menu: VIEW_CONTEXT_MENU,
    command: 'shell.view.hide',
    group: '5_visibility',
    order: 0,
  });
}

export function registerViewPopoutMenu(
  registry: ContributionRegistry,
  popout: PopoutService,
): void {
  registry.addCommand({
    id: 'shell.view.openInWindow',
    paletteHidden: true,
    title: 'panel.viewMenu.openInNewWindow',
    icon: 'popout',
    run: (context) => {
      const viewId = menuContextString(context, 'viewId');
      if (viewId) {
        popout.open(VIEW_PANE_PREFIX + viewId);
      }
    },
  });
  registry.addMenuItem({
    id: 'menu:shell.view.openInWindow',
    menu: VIEW_CONTEXT_MENU,
    command: 'shell.view.openInWindow',
    group: '4_window',
    order: 0,
  });
}
