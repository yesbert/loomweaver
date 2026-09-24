import { Disposable } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { disposeTogether } from '../../contributions/dispose-together';
import { ViewMoveService } from './view-move.service';
import { ViewVisibilityService } from './view-visibility.service';
import { CONTENT_DOCK, viewPanePath } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { menuContextString } from '../../menu/menu-context';
import { ViewStateService } from '../../views/view-state.service';
import { ViewInstanceService } from '../../views/view-instance.service';
import { PopoutService } from '../../popout/popout.service';
import { VIEW_CONTEXT_MENU } from '../pane/chrome/strip-tab';
import { menuEntryId } from '../../menu/menu-entry-id';
import { VIEWS_CUSTOMIZE_COMMAND_ID } from '../../commands/host-command-ids';

const VIEW_HIDE_COMMAND_ID = 'shell.view.hide';
const VIEW_MOVE_TO_OTHER_SIDEBAR_COMMAND_ID = 'shell.view.moveToOtherSidebar';
const VIEW_OPEN_IN_CONTENT_COMMAND_ID = 'shell.view.openInContent';
const VIEW_OPEN_IN_WINDOW_COMMAND_ID = 'shell.view.openInWindow';
const VIEW_RESET_STATE_COMMAND_ID = 'shell.view.resetState';
const VIEW_STACK_BELOW_COMMAND_ID = 'shell.view.stackBelow';

export const PANEL_STRIP_CONTEXT_MENU = 'panel/strip/context';

export function registerViewCustomizeMenu(
  registry: ContributionRegistry,
): Disposable {
  return registry.addMenuItem({
    id: menuEntryId(VIEWS_CUSTOMIZE_COMMAND_ID),
    menu: PANEL_STRIP_CONTEXT_MENU,
    command: VIEWS_CUSTOMIZE_COMMAND_ID,
    group: '9_customize',
    order: 0,
  });
}

export function registerViewMoveMenu(
  registry: ContributionRegistry,
  moves: ViewMoveService,
): Disposable {
  return disposeTogether([
    registry.addCommand({
      id: VIEW_MOVE_TO_OTHER_SIDEBAR_COMMAND_ID,
      paletteHidden: true,
      title: 'panel.viewMenu.moveToOtherSidebar',
      run: (context) => {
        const viewId = menuContextString(context, 'viewId');
        const target = moves.otherPanel(menuContextString(context, 'region'));
        if (viewId && target) {
          moves.move(viewId, target);
        }
      },
    }),
    registry.addMenuItem({
      id: menuEntryId(VIEW_MOVE_TO_OTHER_SIDEBAR_COMMAND_ID),
      menu: VIEW_CONTEXT_MENU,
      command: VIEW_MOVE_TO_OTHER_SIDEBAR_COMMAND_ID,
      group: '1_move',
      order: 0,
      when: { inContent: false },
    }),
  ]);
}

export function registerViewStackMenu(
  registry: ContributionRegistry,
  paneTree: PaneTreeService,
): Disposable {
  return disposeTogether([
    registry.addCommand({
      id: VIEW_STACK_BELOW_COMMAND_ID,
      paletteHidden: true,
      title: 'panel.viewMenu.stackBelow',
      run: (context) => {
        const viewId = menuContextString(context, 'viewId');
        const region = menuContextString(context, 'region');
        if (viewId && region) {
          paneTree.setActiveTab(
            region,
            paneTree.primaryId(region),
            viewPanePath(viewId),
          );
          paneTree.stackView(region, viewId);
        }
      },
    }),
    registry.addMenuItem({
      id: menuEntryId(VIEW_STACK_BELOW_COMMAND_ID),
      menu: VIEW_CONTEXT_MENU,
      command: VIEW_STACK_BELOW_COMMAND_ID,
      group: '2_stack',
      order: 0,
    }),
  ]);
}

export function registerViewResetMenu(
  registry: ContributionRegistry,
  viewStates: ViewStateService,
  viewInstances: ViewInstanceService,
): Disposable {
  return disposeTogether([
    registry.addCommand({
      id: VIEW_RESET_STATE_COMMAND_ID,
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
    }),
    registry.addMenuItem({
      id: menuEntryId(VIEW_RESET_STATE_COMMAND_ID),
      menu: VIEW_CONTEXT_MENU,
      command: VIEW_RESET_STATE_COMMAND_ID,
      group: '3_state',
      order: 0,
    }),
  ]);
}

export function registerViewOpenInContentMenu(
  registry: ContributionRegistry,
  paneTree: PaneTreeService,
): Disposable {
  return disposeTogether([
    registry.addCommand({
      id: VIEW_OPEN_IN_CONTENT_COMMAND_ID,
      paletteHidden: true,
      title: 'panel.viewMenu.openInContent',
      run: (context) => {
        const viewId = menuContextString(context, 'viewId');
        if (viewId) {
          paneTree.splitPane(
            CONTENT_DOCK,
            paneTree.primaryId(CONTENT_DOCK),
            'row',
            viewPanePath(viewId),
          );
        }
      },
    }),
    registry.addMenuItem({
      id: menuEntryId(VIEW_OPEN_IN_CONTENT_COMMAND_ID),
      menu: VIEW_CONTEXT_MENU,
      command: VIEW_OPEN_IN_CONTENT_COMMAND_ID,
      group: '2_stack',
      order: 1,
      when: { inContent: false },
    }),
  ]);
}

export function registerViewHideMenu(
  registry: ContributionRegistry,
  visibility: ViewVisibilityService,
): Disposable {
  return disposeTogether([
    registry.addCommand({
      id: VIEW_HIDE_COMMAND_ID,
      paletteHidden: true,
      title: 'panel.viewMenu.hide',
      run: (context) => {
        const viewId = menuContextString(context, 'viewId');
        if (viewId) {
          visibility.hide(viewId);
        }
      },
    }),
    registry.addMenuItem({
      id: menuEntryId(VIEW_HIDE_COMMAND_ID),
      menu: VIEW_CONTEXT_MENU,
      command: VIEW_HIDE_COMMAND_ID,
      group: '5_visibility',
      order: 0,
    }),
  ]);
}

export function registerViewPopoutMenu(
  registry: ContributionRegistry,
  popout: PopoutService,
): Disposable {
  return disposeTogether([
    registry.addCommand({
      id: VIEW_OPEN_IN_WINDOW_COMMAND_ID,
      paletteHidden: true,
      title: 'panel.viewMenu.openInNewWindow',
      icon: 'popout',
      run: (context) => {
        const viewId = menuContextString(context, 'viewId');
        if (viewId) {
          popout.open(viewPanePath(viewId));
        }
      },
    }),
    registry.addMenuItem({
      id: menuEntryId(VIEW_OPEN_IN_WINDOW_COMMAND_ID),
      menu: VIEW_CONTEXT_MENU,
      command: VIEW_OPEN_IN_WINDOW_COMMAND_ID,
      group: '4_window',
      order: 0,
    }),
  ]);
}
