import { PluginContext } from '@loomweaver/plugin-sdk';
import { testbedActiveContent } from './testbed-active-content';
import { TestbedOutlineView } from './testbed-outline-view';
import { testbedScratch } from './testbed-scratch';
import { testbedSession } from './testbed-session';

export function registerReadouts(ctx: PluginContext): void {
  testbedSession.bind(ctx.session);
  testbedActiveContent.bind(ctx.activeContent);
  testbedScratch.bind(ctx.state.watch('scratch'));

  ctx.registerSurface({
    id: 'testbed.outline',
    title: 'testbed.outline.title',
    padded: true,
    icon: 'outline',
    order: 1,
    instanceable: true,
    docks: ['left-panel'],
    component: TestbedOutlineView,
  });
  ctx.registerSurface({
    id: 'testbed.info',
    docks: ['right-panel'],
    padded: true,
    title: 'testbed.info.title',
    icon: 'info',
    order: 0,
    loadComponent: () =>
      import('./testbed-info-view').then((m) => m.TestbedInfoView),
  });
}

export function releaseReadouts(): void {
  testbedSession.unbind();
  testbedActiveContent.unbind();
  testbedScratch.unbind();
}
