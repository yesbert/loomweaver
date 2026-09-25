import { PluginContext } from '@loomweaver/plugin-sdk';

export function registerSandboxedSurfaces(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.dockedFrame',
    docks: ['right-panel'],
    padded: false,
    title: 'testbed.dockedFrame.title',
    icon: 'testbedSandbox',
    order: 1,
    retain: 'always',
    iframe: '/docked-frame/view.html',
  });

  ctx.registerCommand({
    id: 'testbed.go.sandbox',
    title: 'testbed.sandbox.title',
    icon: 'testbedSandbox',
    run: () =>
      ctx.openContentTab({
        path: 'sandbox-rpc',
        title: 'testbed.sandbox.title',
        icon: 'testbedSandbox',
        preview: true,
      }),
  });
  ctx.registerCommand({
    id: 'testbed.go.sandboxUnclaimed',
    title: 'testbed.sandbox.unclaimed',
    icon: 'testbedSandbox',
    run: () =>
      ctx.openContentTab({
        path: 'sandbox-unclaimed',
        title: 'testbed.sandbox.unclaimed',
        icon: 'testbedSandbox',
        preview: true,
      }),
  });

  ctx.registerRailItem({
    id: 'testbed.rail.sandbox',
    rail: 'primary',
    icon: 'testbedSandbox',
    title: 'testbed.sandbox.title',
    order: 5,
    command: 'testbed.go.sandbox',
    menu: 'testbed.rail/context',
  });
  ctx.registerMenuItem({
    menu: 'testbed.rail/context',
    command: 'testbed.openSettings',
    group: '1_testbed',
    order: 0,
  });
  ctx.registerMenuItem({
    menu: 'testbed.rail/context',
    command: 'testbed.about',
    group: '1_testbed',
    order: 1,
  });
}
