import { PluginContext } from '@loomweaver/plugin-sdk';
import { testbedNavState } from './testbed-nav-state';
import { TestbedNavTreeView } from './testbed-nav-tree-view';
import { TestbedNavView } from './testbed-nav-view';
import { TestbedStatusCount } from './testbed-status-count';

const RESET_TOKEN = 'Reset';

export function registerNavigation(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.nav',
    docks: ['left-panel'],
    padded: false,
    title: 'testbed.nav.title',
    icon: 'navigator',
    order: 0,
    actions: [
      {
        id: 'testbed.nav.add',
        icon: 'add',
        title: 'testbed.nav.add',
        order: 0,
        command: 'testbed.nav.add',
      },
      {
        id: 'testbed.nav.sort',
        icon: 'sort',
        title: 'testbed.nav.sort',
        order: 1,
        command: 'testbed.nav.sort',
      },
      {
        id: 'testbed.nav.lock',
        icon: 'testbedUsers',
        title: 'testbed.nav.lock',
        order: 2,
        command: 'testbed.nav.sort',
        access: { authenticated: true, mode: 'disable' },
      },
      {
        id: 'testbed.nav.reset',
        icon: 'undo',
        title: 'testbed.cmd.reset',
        order: 3,
        command: 'testbed.reset',
      },
    ],
    component: TestbedNavView,
  });
  ctx.registerSurface({
    id: 'testbed.navTree',
    docks: ['left-panel'],
    padded: false,
    title: 'testbed.navTree.title',
    icon: 'navigator',
    order: 3,
    component: TestbedNavTreeView,
  });

  ctx.registerCommand({
    id: 'testbed.reset',
    title: 'testbed.cmd.reset',
    icon: 'undo',
    run: async () => {
      const ok = await ctx.ui.confirm({
        title: 'testbed.cmd.reset',
        message: 'testbed.cmd.resetConfirm',
        confirmLabel: 'testbed.cmd.reset',
        tone: 'danger',
        requireConfirmation: {
          label: 'testbed.cmd.resetGuardLabel',
          placeholder: RESET_TOKEN,
          validate: (value) => (value === RESET_TOKEN ? null : ''),
        },
      });
      if (ok) {
        testbedNavState.reset();
      }
    },
  });
  ctx.registerCommand({
    id: 'testbed.nav.add',
    title: 'testbed.nav.add',
    icon: 'add',
    shortcut: 'mod+enter',
    run: () => testbedNavState.add(),
  });
  ctx.registerCommand({
    id: 'testbed.nav.sort',
    title: 'testbed.nav.sort',
    icon: 'sort',
    run: () => testbedNavState.sortItems(),
  });

  ctx.registerBarItem({
    id: 'testbed.bar.count',
    bar: 'status-bar',
    slot: 'start',
    component: TestbedStatusCount,
  });
  ctx.registerBarItem({
    id: 'testbed.bar.add',
    bar: 'status-bar',
    slot: 'start',
    order: 1,
    icon: 'add',
    tooltip: 'testbed.status.add',
    command: 'testbed.nav.add',
    showShortcut: true,
  });
}
