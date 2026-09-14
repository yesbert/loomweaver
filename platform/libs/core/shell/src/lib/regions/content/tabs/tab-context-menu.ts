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
          id: 'shell.tab.close',
          title: 'content.tabMenu.close',
          run: (c) => tabs.close(menuContextString(c, 'tabId'), paneOf(c)),
        },
        {
          id: 'shell.tab.closeOthers',
          title: 'content.tabMenu.closeOthers',
          run: (c) =>
            tabs.closeOthers(menuContextString(c, 'tabId'), paneOf(c)),
        },
        {
          id: 'shell.tab.closeRight',
          title: 'content.tabMenu.closeRight',
          run: (c) =>
            tabs.closeToRight(menuContextString(c, 'tabId'), paneOf(c)),
        },
        {
          id: 'shell.tab.closeAll',
          title: 'content.tabMenu.closeAll',
          run: (c) => tabs.closeAll(paneOf(c)),
        },
      ],
      items: [
        {
          id: 'menu:shell.tab.close',
          menu: TAB_CONTEXT_MENU,
          command: 'shell.tab.close',
          group: '1_close',
          order: 0,
          when: { closable: true },
        },
        {
          id: 'menu:shell.tab.closeOthers',
          menu: TAB_CONTEXT_MENU,
          command: 'shell.tab.closeOthers',
          group: '1_close',
          order: 1,
        },
        {
          id: 'menu:shell.tab.closeRight',
          menu: TAB_CONTEXT_MENU,
          command: 'shell.tab.closeRight',
          group: '1_close',
          order: 2,
        },
        {
          id: 'menu:shell.tab.closeAll',
          menu: TAB_CONTEXT_MENU,
          command: 'shell.tab.closeAll',
          group: '1_close',
          order: 3,
        },
      ],
    },
    {
      on: content.pin,
      commands: [
        {
          id: 'shell.tab.togglePin',
          title: 'content.tabMenu.pinned',
          run: (c) => {
            const tabId = menuContextString(c, 'tabId');
            const pane = paneOf(c);
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
          id: 'menu:shell.tab.togglePin',
          menu: TAB_CONTEXT_MENU,
          command: 'shell.tab.togglePin',
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
          id: 'shell.tab.openInWindow',
          title: 'content.tabMenu.openInNewWindow',
          icon: 'popout',
          run: (c: MenuContext | undefined) =>
            popout.open(menuContextString(c, 'tabId')),
        },
      ],
      items: [
        {
          id: 'menu:shell.tab.openInWindow',
          menu: TAB_CONTEXT_MENU,
          command: 'shell.tab.openInWindow',
          group: '3_window',
          order: 0,
        },
      ],
    },
    {
      on: content.splitRight,
      commands: [
        {
          id: 'shell.tab.splitRight',
          title: 'content.split.splitRight',
          icon: 'splitPanes',
          run: (c) =>
            paneMove.splitTabOut(
              menuContextString(c, 'tabId'),
              'row',
              paneOf(c),
            ),
        },
      ],
      items: [
        {
          id: 'menu:shell.tab.splitRight',
          menu: TAB_CONTEXT_MENU,
          command: 'shell.tab.splitRight',
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
          id: 'shell.tab.splitDown',
          title: 'content.split.splitDown',
          icon: 'splitPanesDown',
          run: (c) =>
            paneMove.splitTabOut(
              menuContextString(c, 'tabId'),
              'column',
              paneOf(c),
            ),
        },
      ],
      items: [
        {
          id: 'menu:shell.tab.splitDown',
          menu: TAB_CONTEXT_MENU,
          command: 'shell.tab.splitDown',
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

function paneOf(context: MenuContext | undefined): PaneRef | undefined {
  if (context?.['primary'] !== false) {
    return undefined;
  }
  const dock = context['group'];
  const paneId = context['paneId'];
  return typeof dock === 'string' && typeof paneId === 'string'
    ? { dock, paneId }
    : undefined;
}
