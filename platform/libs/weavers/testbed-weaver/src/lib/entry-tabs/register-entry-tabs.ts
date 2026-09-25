import { PluginContext } from '@loomweaver/plugin-sdk';
import { ENTRY_LIST_SURFACE, entryTabs } from './entry-tab-actions';
import { TestbedEntryView } from './testbed-entry-view';
import { TestbedListView } from './testbed-list-view';

export function registerEntryTabs(ctx: PluginContext): void {
  ctx.registerSurface({
    id: 'testbed.entry',
    title: 'testbed.entry.title',
    routable: {
      path: 'entry/:id',
      subRoutes: ['detail', 'meta', 'message/:messageId'],
    },
    component: TestbedEntryView,
  });
  ctx.registerSurface({
    id: ENTRY_LIST_SURFACE,
    title: 'testbed.list.title',
    badge: { text: 'testbed.badge.beta' },
    padded: true,
    icon: 'testbedList',
    order: 2,
    instanceable: true,
    docks: ['left-panel'],
    component: TestbedListView,
  });

  ctx.registerCommand({
    id: 'testbed.focusLibrary',
    title: 'testbed.list.focus',
    icon: 'testbedDocument',
    run: () => entryTabs.revealList(),
  });
  ctx.registerCommand({
    id: 'testbed.flagEntries',
    title: 'testbed.cmd.flagEntries',
    icon: 'testbedEntry',
    run: () => entryTabs.toggleFlagOnOpenEntries(),
  });
}
