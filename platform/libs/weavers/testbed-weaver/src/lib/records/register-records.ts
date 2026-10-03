import { PluginContext } from '@loomweaver/plugin-sdk';
import { testbedContext } from '../bound-context';
import { RECORDS_TOOLBAR } from './records-slot';
import { TestbedRecordsView } from './testbed-records-view';

export const RECORDS_PATH = 'records';

const TOAST_MS = 3000;

export function registerRecords(ctx: PluginContext): void {
  ctx.registerToolbar({ slot: RECORDS_TOOLBAR, title: 'testbed.records.toolbar' });
  ctx.registerSurface({
    id: 'testbed.records',
    title: 'testbed.records.title',
    routable: { path: RECORDS_PATH },
    component: TestbedRecordsView,
  });
  ctx.registerCommand({
    id: 'testbed.records.open',
    title: 'testbed.records.open',
    icon: 'testbedOpen',
    run: (context) =>
      ctx.ui.toast({
        message: `Opened ${String(context?.['record'] ?? '')}`,
        timeoutMs: TOAST_MS,
      }),
  });
  ctx.registerMenuItem({
    id: 'testbed.records.open',
    menu: RECORDS_TOOLBAR,
    command: 'testbed.records.open',
    group: '0_own',
    order: 0,
  });
  ctx.registerCommand({
    id: 'testbed.go.records',
    title: 'testbed.records.title',
    icon: 'testbedList',
    run: () => testbedContext.navigateTo(RECORDS_PATH),
  });
}
