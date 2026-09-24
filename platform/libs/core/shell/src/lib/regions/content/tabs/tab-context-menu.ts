import { Injector, Signal } from '@angular/core';
import {
  Command,
  Disposable,
  MenuContext,
  MenuItem,
} from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { disposeTogether } from '../../../plugin/dispose-together';
import { FeatureSwitches } from '../../../features/feature-switches.service';
import { whileOn } from '../../../features/while-on';
import { ContentTabsService } from './content-tabs.service';
import { PaneMoveService } from '../../pane/drag/pane-move.service';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { PopoutService } from '../../../popout/popout.service';
import { menuContextString } from '../../../menu/menu-context';
import { PaneRef } from '../../pane/tree/pane-address';
import { menuEntryId } from '../../../menu/menu-entry-id';

const TAB_CLOSE_COMMAND_ID = 'shell.tab.close';
const TAB_CLOSE_ALL_COMMAND_ID = 'shell.tab.closeAll';
const TAB_CLOSE_OTHERS_COMMAND_ID = 'shell.tab.closeOthers';
const TAB_CLOSE_RIGHT_COMMAND_ID = 'shell.tab.closeRight';
const TAB_OPEN_IN_WINDOW_COMMAND_ID = 'shell.tab.openInWindow';
const TAB_SPLIT_DOWN_COMMAND_ID = 'shell.tab.splitDown';
const TAB_SPLIT_RIGHT_COMMAND_ID = 'shell.tab.splitRight';
const TAB_TOGGLE_PIN_COMMAND_ID = 'shell.tab.togglePin';

export const TAB_CONTEXT_MENU = 'content/tab/context';

interface TabMenuGroup {
  readonly on: Signal<boolean>;
  readonly commands: readonly Command[];
  readonly items: readonly MenuItem[];
}

export function registerTabContextMenu(
  registry: ContributionRegistry,
  tabs: ContentTabsService,
  paneMove: PaneMoveService,
  paneTree: PaneTreeService,
  popout: PopoutService,
  switches: FeatureSwitches,
  injector: Injector,
): void {
  const content = switches.content;
  const groups: readonly TabMenuGroup[] = [
    {
      on: content.close,
      commands: [
        {
          id: TAB_CLOSE_COMMAND_ID,
          title: 'content.tabMenu.close',
          run: (c) =>
            tabs.close(menuContextString(c, 'tabId'), paneOf(c, paneTree)),
        },
        {
          id: TAB_CLOSE_OTHERS_COMMAND_ID,
          title: 'content.tabMenu.closeOthers',
          run: (c) =>
            tabs.closeOthers(
              menuContextString(c, 'tabId'),
              paneOf(c, paneTree),
            ),
        },
        {
          id: TAB_CLOSE_RIGHT_COMMAND_ID,
          title: 'content.tabMenu.closeRight',
          run: (c) =>
            tabs.closeToRight(
              menuContextString(c, 'tabId'),
              paneOf(c, paneTree),
            ),
        },
        {
          id: TAB_CLOSE_ALL_COMMAND_ID,
          title: 'content.tabMenu.closeAll',
          run: (c) => tabs.closeAll(paneOf(c, paneTree)),
        },
      ],
      items: [
        {
          id: menuEntryId(TAB_CLOSE_COMMAND_ID),
          menu: TAB_CONTEXT_MENU,
          command: TAB_CLOSE_COMMAND_ID,
          group: '1_close',
          order: 0,
          when: { closable: true },
        },
        {
          id: menuEntryId(TAB_CLOSE_OTHERS_COMMAND_ID),
          menu: TAB_CONTEXT_MENU,
          command: TAB_CLOSE_OTHERS_COMMAND_ID,
          group: '1_close',
          order: 1,
        },
        {
          id: menuEntryId(TAB_CLOSE_RIGHT_COMMAND_ID),
          menu: TAB_CONTEXT_MENU,
          command: TAB_CLOSE_RIGHT_COMMAND_ID,
          group: '1_close',
          order: 2,
        },
        {
          id: menuEntryId(TAB_CLOSE_ALL_COMMAND_ID),
          menu: TAB_CONTEXT_MENU,
          command: TAB_CLOSE_ALL_COMMAND_ID,
          group: '1_close',
          order: 3,
        },
      ],
    },
    {
      on: content.pin,
      commands: [
        {
          id: TAB_TOGGLE_PIN_COMMAND_ID,
          title: 'content.tabMenu.pinned',
          run: (c) => {
            const tabId = menuContextString(c, 'tabId');
            const pane = paneOf(c, paneTree);
            if (pane) {
              paneTree[c?.['pinned'] ? 'unpinTab' : 'pinTab'](
                pane.dock,
                pane.paneId,
                tabId,
              );
              return;
            }
            if (c?.['pinned']) {
              tabs.unpin(tabId);
            } else {
              tabs.pin(tabId);
            }
          },
        },
      ],
      items: [
        {
          id: menuEntryId(TAB_TOGGLE_PIN_COMMAND_ID),
          menu: TAB_CONTEXT_MENU,
          command: TAB_TOGGLE_PIN_COMMAND_ID,
          group: '2_pin',
          order: 0,
          when: { closable: true },
          checkedWhen: { pinned: true },
        },
      ],
    },
    {
      on: switches.windows.popout,
      commands: [
        {
          id: TAB_OPEN_IN_WINDOW_COMMAND_ID,
          title: 'content.tabMenu.openInNewWindow',
          icon: 'popout',
          run: (c: MenuContext | undefined) =>
            popout.open(menuContextString(c, 'tabId')),
        },
      ],
      items: [
        {
          id: menuEntryId(TAB_OPEN_IN_WINDOW_COMMAND_ID),
          menu: TAB_CONTEXT_MENU,
          command: TAB_OPEN_IN_WINDOW_COMMAND_ID,
          group: '3_window',
          order: 0,
        },
      ],
    },
    {
      on: content.splitRight,
      commands: [
        {
          id: TAB_SPLIT_RIGHT_COMMAND_ID,
          title: 'content.split.splitRight',
          icon: 'splitPanes',
          run: (c) =>
            paneMove.splitTabOut(
              menuContextString(c, 'tabId'),
              'row',
              paneOf(c, paneTree),
            ),
        },
      ],
      items: [
        {
          id: menuEntryId(TAB_SPLIT_RIGHT_COMMAND_ID),
          menu: TAB_CONTEXT_MENU,
          command: TAB_SPLIT_RIGHT_COMMAND_ID,
          group: '0_split',
          order: 0,
          when: { closable: true, sole: false },
        },
      ],
    },
    {
      on: content.splitDown,
      commands: [
        {
          id: TAB_SPLIT_DOWN_COMMAND_ID,
          title: 'content.split.splitDown',
          icon: 'splitPanesDown',
          run: (c) =>
            paneMove.splitTabOut(
              menuContextString(c, 'tabId'),
              'column',
              paneOf(c, paneTree),
            ),
        },
      ],
      items: [
        {
          id: menuEntryId(TAB_SPLIT_DOWN_COMMAND_ID),
          menu: TAB_CONTEXT_MENU,
          command: TAB_SPLIT_DOWN_COMMAND_ID,
          group: '0_split',
          order: 1,
          when: { closable: true, sole: false },
        },
      ],
    },
  ];
  for (const group of groups) {
    whileOn(injector, group.on, () => register(registry, group));
  }
}

function register(
  registry: ContributionRegistry,
  group: TabMenuGroup,
): Disposable {
  return disposeTogether([
    ...group.commands.map((command) =>
      registry.addCommand({ ...command, paletteHidden: true }),
    ),
    ...group.items.map((item) => registry.addMenuItem(item)),
  ]);
}

function paneOf(
  context: MenuContext | undefined,
  paneTree: PaneTreeService,
): PaneRef | undefined {
  if (context?.['primary'] === true) {
    return undefined;
  }
  return context?.['primary'] === false
    ? namedPane(context)
    : holdingPane(context, paneTree);
}

function namedPane(context: MenuContext): PaneRef | undefined {
  const dock = context['group'];
  const paneId = context['paneId'];
  return typeof dock === 'string' && typeof paneId === 'string'
    ? { dock, paneId }
    : undefined;
}

function holdingPane(
  context: MenuContext | undefined,
  paneTree: PaneTreeService,
): PaneRef | undefined {
  const tabId = context?.['tabId'];
  const holder = typeof tabId === 'string' ? paneTree.sourceOf(tabId) : null;
  return holder === null || paneTree.holdsAddress(holder) ? undefined : holder;
}
