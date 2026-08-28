import { Command, MenuContext, MenuItem } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ContentTabsService } from './content-tabs.service';
import { PaneMoveService } from '../../pane/drag/pane-move.service';
import { PopoutService } from '../../../popout/popout.service';
import { menuContextString } from '../../../menu/menu-context';
import { ShellFeatures } from '../../../foundation/shell-features';

export const TAB_CONTEXT_MENU = 'content/tab/context';

export function registerTabContextMenu(
  registry: ContributionRegistry,
  tabs: ContentTabsService,
  paneMove: PaneMoveService,
  popout: PopoutService,
  shell: ShellFeatures,
): void {
  const features = shell.content;
  const closing: readonly Command[] = [
    {
      id: 'shell.tab.close',
      title: 'content.tabMenu.close',
      run: (c) => tabs.close(menuContextString(c, 'tabId')),
    },
    {
      id: 'shell.tab.closeOthers',
      title: 'content.tabMenu.closeOthers',
      run: (c) => tabs.closeOthers(menuContextString(c, 'tabId')),
    },
    {
      id: 'shell.tab.closeRight',
      title: 'content.tabMenu.closeRight',
      run: (c) => tabs.closeToRight(menuContextString(c, 'tabId')),
    },
    {
      id: 'shell.tab.closeAll',
      title: 'content.tabMenu.closeAll',
      run: () => tabs.closeAll(),
    },
  ];
  const pinning: readonly Command[] = [
    {
      id: 'shell.tab.togglePin',
      title: 'content.tabMenu.pinned',
      run: (c) =>
        c?.['pinned']
          ? tabs.unpin(menuContextString(c, 'tabId'))
          : tabs.pin(menuContextString(c, 'tabId')),
    },
  ];
  const splitting: readonly Command[] = [
    {
      id: 'shell.tab.splitRight',
      title: 'content.split.splitRight',
      icon: 'splitPanes',
      run: (c) =>
        paneMove.splitFromUrlGroup(menuContextString(c, 'tabId'), 'row'),
    },
    {
      id: 'shell.tab.splitDown',
      title: 'content.split.splitDown',
      icon: 'splitPanesDown',
      run: (c) =>
        paneMove.splitFromUrlGroup(menuContextString(c, 'tabId'), 'column'),
    },
  ];
  const commands: readonly Command[] = [
    ...(features.close ? closing : []),
    ...(features.pin ? pinning : []),
    ...(shell.windows.popout
      ? [
          {
            id: 'shell.tab.openInWindow',
            title: 'content.tabMenu.openInNewWindow',
            icon: 'popout',
            run: (c: MenuContext | undefined) =>
              popout.open(menuContextString(c, 'tabId')),
          },
        ]
      : []),
    ...splitting.filter((command) =>
      command.id === 'shell.tab.splitRight'
        ? features.splitRight
        : features.splitDown,
    ),
  ];
  const items: readonly MenuItem[] = [
    {
      id: 'menu:shell.tab.splitRight',
      menu: TAB_CONTEXT_MENU,
      command: 'shell.tab.splitRight',
      group: '0_split',
      order: 0,
      when: { closable: true },
    },
    {
      id: 'menu:shell.tab.splitDown',
      menu: TAB_CONTEXT_MENU,
      command: 'shell.tab.splitDown',
      group: '0_split',
      order: 1,
      when: { closable: true },
    },
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
    {
      id: 'menu:shell.tab.openInWindow',
      menu: TAB_CONTEXT_MENU,
      command: 'shell.tab.openInWindow',
      group: '3_window',
      order: 0,
    },
    {
      id: 'menu:shell.tab.togglePin',
      menu: TAB_CONTEXT_MENU,
      command: 'shell.tab.togglePin',
      group: '2_pin',
      order: 0,
      when: { closable: true },
      checkedWhen: { pinned: true },
    },
  ];
  const registered = new Set(commands.map((command) => command.id));
  commands.forEach((command) =>
    registry.addCommand({ ...command, paletteHidden: true }),
  );
  items
    .filter(
      (item) => item.command !== undefined && registered.has(item.command),
    )
    .forEach((item) => registry.addMenuItem(item));
}
