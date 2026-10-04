import { Plugin } from '@loomweaver/plugin-sdk';
import { RECORDS_TOOLBAR } from '../records/records-slot';
import { FillerCountCell } from './filler-count-cell';

const SOURCES_MENU = 'testbed.records/sources';

const SANDBOX_TOOLBAR = 'sandbox-rpc.view/toolbar';

const SANDBOX_SOURCES = 'sandbox-rpc.view/sources';

const TOAST_MS = 3000;

export const testbedFillerPlugin: Plugin = {
  manifest: {
    id: 'testbed-filler',
    name: 'Testbed filler',
    capabilities: ['contributions', 'ui'],
  },
  activate(ctx) {
    ctx.registerCommand({
      id: 'testbed.filler.star',
      title: 'testbed.filler.star',
      icon: 'testbedStar',
      run: (context) =>
        ctx.ui.toast({
          message: `Starred ${String(context?.['record'] ?? '')}`,
          timeoutMs: TOAST_MS,
        }),
    });
    ctx.registerCommand({
      id: 'testbed.filler.import',
      title: 'testbed.filler.import',
      icon: 'add',
      run: () =>
        ctx.ui.toast({ message: 'testbed.filler.imported', timeoutMs: TOAST_MS }),
    });
    ctx.registerMenuItem({
      menu: RECORDS_TOOLBAR,
      command: 'testbed.filler.star',
      group: '1_filler',
      when: { kind: 'note' },
    });
    ctx.registerMenuItem({
      id: 'testbed.filler.sources',
      menu: RECORDS_TOOLBAR,
      title: 'testbed.filler.sources',
      icon: 'more',
      group: '1_filler',
      order: 1,
      submenu: SOURCES_MENU,
      menuHeader: { title: 'testbed.filler.sources' },
    });
    ctx.registerMenuItem({ menu: SOURCES_MENU, command: 'testbed.filler.import' });
    ctx.registerToolbarCell({
      id: 'testbed.filler.count',
      slot: RECORDS_TOOLBAR,
      component: FillerCountCell,
      order: 10,
    });
    ctx.registerMenuItem({ menu: SANDBOX_TOOLBAR, command: 'testbed.filler.star', order: 0 });
    ctx.registerMenuItem({ menu: SANDBOX_TOOLBAR, command: 'testbed.secret', order: 1 });
    ctx.registerMenuItem({
      id: 'testbed.filler.sandboxSources',
      menu: SANDBOX_TOOLBAR,
      title: 'testbed.filler.sources',
      icon: 'more',
      order: 2,
      submenu: SANDBOX_SOURCES,
      menuHeader: { title: 'testbed.filler.sources' },
    });
    ctx.registerMenuItem({ menu: SANDBOX_SOURCES, command: 'testbed.filler.import' });
    ctx.registerToolbarCell({
      id: 'testbed.filler.sandboxCount',
      slot: SANDBOX_TOOLBAR,
      component: FillerCountCell,
    });
  },
};
