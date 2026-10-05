import { Disposable } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { registerMenuCommand } from '../../menu/context-menu-entry';
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
  return registerMenuCommand(
    registry,
    VIEW_CONTEXT_MENU,
    {
      id: VIEW_MOVE_TO_OTHER_SIDEBAR_COMMAND_ID,
      title: 'panel.viewMenu.moveToOtherSidebar',
      run: (context) => {
        const viewId = menuContextString(context, 'viewId');
        const target = moves.otherPanel(menuContextString(context, 'region'));
        if (viewId && target) {
          moves.move(viewId, target);
        }
      },
    },
    {
      group: '1_move',
      order: 0,
      when: { inContent: false },
    },
  );
}

export function registerViewStackMenu(
  registry: ContributionRegistry,
  paneTree: PaneTreeService,
): Disposable {
  return registerMenuCommand(
    registry,
    VIEW_CONTEXT_MENU,
    {
      id: VIEW_STACK_BELOW_COMMAND_ID,
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
    },
    {
      group: '2_stack',
      order: 0,
    },
  );
}

export function registerViewResetMenu(
  registry: ContributionRegistry,
  viewStates: ViewStateService,
  viewInstances: ViewInstanceService,
): Disposable {
  return registerMenuCommand(
    registry,
    VIEW_CONTEXT_MENU,
    {
      id: VIEW_RESET_STATE_COMMAND_ID,
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
    },
    {
      group: '3_state',
      order: 0,
    },
  );
}

export function registerViewOpenInContentMenu(
  registry: ContributionRegistry,
  paneTree: PaneTreeService,
): Disposable {
  return registerMenuCommand(
    registry,
    VIEW_CONTEXT_MENU,
    {
      id: VIEW_OPEN_IN_CONTENT_COMMAND_ID,
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
    },
    {
      group: '2_stack',
      order: 1,
      when: { inContent: false },
    },
  );
}

export function registerViewHideMenu(
  registry: ContributionRegistry,
  visibility: ViewVisibilityService,
): Disposable {
  return registerMenuCommand(
    registry,
    VIEW_CONTEXT_MENU,
    {
      id: VIEW_HIDE_COMMAND_ID,
      title: 'panel.viewMenu.hide',
      run: (context) => {
        const viewId = menuContextString(context, 'viewId');
        if (viewId) {
          visibility.hide(viewId);
        }
      },
    },
    {
      group: '5_visibility',
      order: 0,
    },
  );
}

export function registerViewPopoutMenu(
  registry: ContributionRegistry,
  popout: PopoutService,
): Disposable {
  return registerMenuCommand(
    registry,
    VIEW_CONTEXT_MENU,
    {
      id: VIEW_OPEN_IN_WINDOW_COMMAND_ID,
      title: 'panel.viewMenu.openInNewWindow',
      icon: 'popout',
      run: (context) => {
        const viewId = menuContextString(context, 'viewId');
        if (viewId) {
          popout.open(viewPanePath(viewId));
        }
      },
    },
    {
      group: '4_window',
      order: 0,
    },
  );
}
