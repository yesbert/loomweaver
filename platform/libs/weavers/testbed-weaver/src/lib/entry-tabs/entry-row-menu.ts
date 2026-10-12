import { PluginContext, UiMenuItem } from '@loomweaver/plugin-sdk';
import { Entry, EntryStatus } from './testbed-entries';
import { entryTabs } from './entry-tab-actions';

const TOAST_MS = 3000;

const MOVES: readonly (readonly [label: string, shortcut: string])[] = [
  ['testbed.list.ctxMoveTop', 'alt+shift+ArrowUp'],
  ['testbed.list.ctxMoveUp', 'alt+ArrowUp'],
  ['testbed.list.ctxMoveDown', 'alt+ArrowDown'],
  ['testbed.list.ctxMoveBottom', 'alt+shift+ArrowDown'],
];

const STATUSES: readonly (readonly [status: EntryStatus, icon: string])[] = [
  ['open', 'testbedOpen'],
  ['waiting', 'testbedWaiting'],
  ['resolved', 'testbedResolved'],
];

export function entryRowMenu(
  ctx: Pick<PluginContext, 'ui'>,
  entry: Entry,
): readonly UiMenuItem[] {
  const tell = (message: string) => () =>
    ctx.ui.toast({ message, timeoutMs: TOAST_MS });
  return [
    {
      label: 'testbed.list.ctxOpen',
      icon: 'testbedEntry',
      run: () => entryTabs.openEntry(entry, 'permanent'),
    },
    {
      label: 'testbed.list.ctxPreview',
      icon: 'preview',
      run: () => entryTabs.openEntry(entry, 'preview'),
    },
    {
      label: 'testbed.list.ctxMove',
      icon: 'sort',
      items: MOVES.map(([label, shortcut]) => ({
        label,
        shortcut,
        run: tell('testbed.list.moved'),
      })),
    },
    {
      label: 'testbed.list.ctxStatus',
      icon: 'testbedWaiting',
      items: STATUSES.map(([status, icon]) => ({
        label: `testbed.list.status.${status}`,
        icon,
        run: tell('testbed.list.statusSet'),
      })),
    },
  ];
}
