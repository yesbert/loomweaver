import { defineLwIcon } from '../elements/icon/lw-icon.element';
import { defineLwMenu, LW_MENU_ITEM_TAG, LW_MENU_TAG } from '../elements/menu/lw-menu.element';
import {
  defineLwToolbar,
  LW_TOOLBAR_TAG,
  LwToolbarElement,
} from '../elements/toolbar/lw-toolbar.element';
import { installLwToolbarHost } from '../elements/toolbar/toolbar-bridge';
import { defineLwTooltip } from '../elements/tooltip/lw-tooltip.element';
import type { LwSlotHost, LwSlotView } from './surface-kit.frame';
import { createToolbars } from './surface-toolbars';

defineLwIcon();
defineLwTooltip();
defineLwMenu();
defineLwToolbar();

interface Call {
  readonly method: string;
  readonly args: unknown[];
}

function fakeHost(): LwSlotHost & { calls: Call[] } {
  let counter = 0;
  const calls: Call[] = [];
  return {
    calls,
    slotWatch(slot, context) {
      calls.push({ method: 'slotWatch', args: [slot, context] });
      counter += 1;
      return Promise.resolve(`sub-${counter}`);
    },
    slotUnwatch(subscription) {
      calls.push({ method: 'slotUnwatch', args: [subscription] });
    },
    slotActivate(subscription, key) {
      calls.push({ method: 'slotActivate', args: [subscription, key] });
    },
  };
}

function place(menu: string, context: Record<string, string>): LwToolbarElement {
  const toolbar = document.createElement(LW_TOOLBAR_TAG) as LwToolbarElement;
  toolbar.setAttribute('menu', menu);
  toolbar.context = context;
  document.body.append(toolbar);
  return toolbar;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('toolbars inside an isolated surface', () => {
  afterEach(() => {
    installLwToolbarHost(undefined);
    document.body.replaceChildren();
  });

  it('watches each placed toolbar on the host once connected, with its slot and context', async () => {
    const toolbars = createToolbars();
    const host = fakeHost();
    const toolbar = place('acme/toolbar', { record: 'r1' });

    toolbars.connect(host);
    await flush();

    expect(host.calls).toEqual([{ method: 'slotWatch', args: ['acme/toolbar', { record: 'r1' }] }]);
    expect(toolbar.isConnected).toBe(true);
  });

  it('draws what the host pushes and reports an activation under the subscription', async () => {
    const toolbars = createToolbars();
    const host = fakeHost();
    toolbars.connect(host);
    const toolbar = place('acme/toolbar', { record: 'r1' });
    await flush();

    toolbars.apply('sub-1', {
      label: 'Tools',
      moreLabel: 'More',
      entries: [{ key: 'share', label: 'Share', icon: 'share' }],
    });
    const button = toolbar.querySelector<HTMLButtonElement>('button[data-lw-entry="share"]') as HTMLButtonElement;
    expect(toolbar.getAttribute('aria-label')).toBe('Tools');
    expect(button.getAttribute('aria-label')).toBe('Share');

    button.click();

    expect(host.calls.at(-1)).toEqual({ method: 'slotActivate', args: ['sub-1', 'share'] });
  });

  it('re-watches when the placement changes and unwatches when it leaves', async () => {
    const toolbars = createToolbars();
    const host = fakeHost();
    toolbars.connect(host);
    const toolbar = place('acme/toolbar', { record: 'r1' });
    await flush();

    toolbar.context = { record: 'r2' };
    await flush();
    toolbar.remove();

    expect(host.calls.map((call) => call.method)).toEqual([
      'slotWatch',
      'slotUnwatch',
      'slotWatch',
      'slotUnwatch',
    ]);
    expect(host.calls[2].args).toEqual(['acme/toolbar', { record: 'r2' }]);
  });

  it('opens an entry’s submenu as a menu it draws itself, and runs the chosen entry under that slot', async () => {
    const toolbars = createToolbars();
    const host = fakeHost();
    toolbars.connect(host);
    const toolbar = place('acme/toolbar', {});
    await flush();
    toolbars.apply('sub-1', {
      label: 'Tools',
      moreLabel: 'More',
      entries: [{ key: 'sources', label: 'Sources', opensMenu: true, submenu: 'acme/sources' }],
    });
    const button = toolbar.querySelector<HTMLButtonElement>('button[data-lw-entry="sources"]') as HTMLButtonElement;

    button.click();
    await flush();
    expect(host.calls.at(-1)).toEqual({ method: 'slotWatch', args: ['acme/sources', {}] });
    expect(toolbar.openKey).toBe('sources');

    const submenu: LwSlotView = {
      label: 'Sources',
      moreLabel: 'More',
      entries: [{ key: 'import', label: 'Import', icon: 'add', shortcut: 'Ctrl+I' }],
    };
    toolbars.apply('sub-2', submenu);
    const menu = document.body.querySelector(LW_MENU_TAG) as HTMLElement;
    expect(menu).not.toBeNull();
    const item = menu.querySelector(LW_MENU_ITEM_TAG) as HTMLElement;
    expect(item.getAttribute('label')).toBe('Import');
    expect(item.getAttribute('shortcut')).toBe('Ctrl+I');

    item.click();

    const activated = host.calls.findIndex((call) => call.method === 'slotActivate');
    const unwatched = host.calls.findIndex((call) => call.method === 'slotUnwatch' && call.args[0] === 'sub-2');
    expect(host.calls[activated]).toEqual({ method: 'slotActivate', args: ['sub-2', 'import'] });
    expect(unwatched).toBeGreaterThan(activated);
    expect(document.body.querySelector(LW_MENU_TAG)).toBeNull();
    expect(toolbar.openKey).toBeNull();
  });

  it('holds the watch for a toolbar placed before the host connected', async () => {
    const toolbars = createToolbars();
    place('acme/early', { a: 'b' });
    const host = fakeHost();

    toolbars.connect(host);
    await flush();

    expect(host.calls).toEqual([{ method: 'slotWatch', args: ['acme/early', { a: 'b' }] }]);
  });
});
