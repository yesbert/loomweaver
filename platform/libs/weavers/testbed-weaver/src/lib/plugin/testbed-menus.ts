import { PluginContext } from '@loomweaver/plugin-sdk';

export function registerMenus(ctx: PluginContext): void {
  ctx.registerCommand({
    id: 'testbed.tab.reveal',
    title: 'testbed.tab.reveal',
    icon: 'search',
    run: () => ctx.ui.toast({ message: 'testbed.tab.revealed', timeoutMs: 4000 }),
  });
  ctx.registerMenuItem({
    menu: 'content/tab/context',
    command: 'testbed.tab.reveal',
    group: '3_plugin',
    order: 0,
    when: { closable: true },
  });
  ctx.registerMenuItem({
    menu: 'testbed.account/menu',
    command: 'testbed.openSettings',
    group: '1_account',
    order: 0,
  });
  ctx.registerMenuItem({
    menu: 'testbed.account/menu',
    command: 'testbed.auth.cycle',
    group: '1_account',
    order: 1,
  });
  ctx.registerMenuItem({
    menu: 'testbed.account/menu',
    command: 'testbed.auth.signOut',
    group: '2_session',
    order: 0,
  });
  ctx.registerMenuItem({
    menu: 'testbed.rail/context',
    command: 'testbed.openSettings',
    group: '1_demo',
    order: 0,
  });
  ctx.registerMenuItem({
    menu: 'testbed.rail/context',
    command: 'testbed.about',
    group: '1_demo',
    order: 1,
  });
}
