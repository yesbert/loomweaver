import { Injector, Signal } from '@angular/core';
import {
  Command,
  Disposable,
  MenuContext,
  MenuItem,
} from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { disposeTogether } from '../../../contributions/dispose-together';
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

export interface TabMenuDeps {
  readonly tabs: ContentTabsService;
  readonly paneMove: PaneMoveService;
  readonly paneTree: PaneTreeService;
  readonly popout: PopoutService;
  readonly features: FeatureSwitches;
  readonly injector: Injector;
}

interface TabMenuEntry {
  readonly command: Command;
  readonly item: MenuItem;
}

interface TabMenuGroup {
  readonly on: Signal<boolean>;
  readonly entries: readonly TabMenuEntry[];
}

type Placement = Pick<MenuItem, 'group' | 'order' | 'when' | 'checkedWhen'>;

export function registerTabContextMenu(
  registry: ContributionRegistry,
  deps: TabMenuDeps,
): void {
  const { tabs, paneMove, paneTree, popout, features } = deps;
  const content = features.content;
  const groups: readonly TabMenuGroup[] = [
    {
      on: content.close,
      entries: [
        tabEntry(
          {
            id: TAB_CLOSE_COMMAND_ID,
            title: 'content.tabMenu.close',
            run: (c) =>
              tabs.close(menuContextString(c, 'tabId'), paneOf(c, paneTree)),
          },
          { group: '1_close', order: 0, when: { closable: true } },
        ),
        tabEntry(
          {
            id: TAB_CLOSE_OTHERS_COMMAND_ID,
            title: 'content.tabMenu.closeOthers',
            run: (c) =>
              tabs.closeOthers(
                menuContextString(c, 'tabId'),
                paneOf(c, paneTree),
              ),
          },
          { group: '1_close', order: 1 },
        ),
        tabEntry(
          {
            id: TAB_CLOSE_RIGHT_COMMAND_ID,
            title: 'content.tabMenu.closeRight',
            run: (c) =>
              tabs.closeToRight(
                menuContextString(c, 'tabId'),
                paneOf(c, paneTree),
              ),
          },
          { group: '1_close', order: 2 },
        ),
        tabEntry(
          {
            id: TAB_CLOSE_ALL_COMMAND_ID,
            title: 'content.tabMenu.closeAll',
            run: (c) => tabs.closeAll(paneOf(c, paneTree)),
          },
          { group: '1_close', order: 3 },
        ),
      ],
    },
    {
      on: content.pin,
      entries: [
        tabEntry(
          {
            id: TAB_TOGGLE_PIN_COMMAND_ID,
            title: 'content.tabMenu.pinned',
            run: (c) => togglePin(c, deps),
          },
          {
            group: '2_pin',
            order: 0,
            when: { closable: true },
            checkedWhen: { pinned: true },
          },
        ),
      ],
    },
    {
      on: features.windows.popout,
      entries: [
        tabEntry(
          {
            id: TAB_OPEN_IN_WINDOW_COMMAND_ID,
            title: 'content.tabMenu.openInNewWindow',
            icon: 'popout',
            run: (c) => popout.open(menuContextString(c, 'tabId')),
          },
          { group: '3_window', order: 0 },
        ),
      ],
    },
    {
      on: content.splitRight,
      entries: [
        tabEntry(
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
          { group: '0_split', order: 0, when: { closable: true, sole: false } },
        ),
      ],
    },
    {
      on: content.splitDown,
      entries: [
        tabEntry(
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
          { group: '0_split', order: 1, when: { closable: true, sole: false } },
        ),
      ],
    },
  ];
  for (const group of groups) {
    whileOn(deps.injector, group.on, () => register(registry, group));
  }
}

function tabEntry(command: Command, placement: Placement): TabMenuEntry {
  return {
    command,
    item: {
      id: menuEntryId(command.id),
      menu: TAB_CONTEXT_MENU,
      command: command.id,
      ...placement,
    },
  };
}

function register(
  registry: ContributionRegistry,
  group: TabMenuGroup,
): Disposable {
  return disposeTogether([
    ...group.entries.map(({ command }) =>
      registry.addCommand({ ...command, paletteHidden: true }),
    ),
    ...group.entries.map(({ item }) => registry.addMenuItem(item)),
  ]);
}

function togglePin(context: MenuContext | undefined, deps: TabMenuDeps): void {
  const tabId = menuContextString(context, 'tabId');
  const pinned = Boolean(context?.['pinned']);
  const pane = paneOf(context, deps.paneTree);
  if (pane === undefined) {
    if (pinned) {
      deps.tabs.unpin(tabId);
    } else {
      deps.tabs.pin(tabId);
    }
    return;
  }
  if (pinned) {
    deps.paneTree.unpinTab(pane.dock, pane.paneId, tabId);
  } else {
    deps.paneTree.pinTab(pane.dock, pane.paneId, tabId);
  }
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
  return holder === null || paneTree.carriesAddress(holder)
    ? undefined
    : holder;
}
