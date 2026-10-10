import { expectTypeOf } from 'vitest';
import { defineLwIcon } from '../elements/icon/lw-icon.element';
import { defineLwMenu, LW_MENU_ITEM_TAG, LW_MENU_TAG } from '../elements/menu/lw-menu.element';
import {
  defineLwToolbar,
  LW_TOOLBAR_TAG,
  LwToolbarElement,
  LwToolbarEntry,
} from '../elements/toolbar/lw-toolbar.element';
import { installLwToolbarHost } from '../elements/toolbar/toolbar-bridge';
import { defineLwTooltip } from '../elements/tooltip/lw-tooltip.element';
import type { LwSlotEntry, LwSlotHost, LwSlotView } from './surface-kit.frame';
import { createToolbars } from './surface-toolbars';

defineLwIcon();
defineLwTooltip();
defineLwMenu();
defineLwToolbar();

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

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
    slotOpen(subscription, key) {
      calls.push({ method: 'slotOpen', args: [subscription, key] });
      counter += 1;
      return Promise.resolve(`sub-${counter}`);
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

  it('opens an entry’s menu through the entry, draws it as the page does, and runs the chosen entry under it', async () => {
    const toolbars = createToolbars();
    const host = fakeHost();
    toolbars.connect(host);
    const toolbar = place('acme/toolbar', {});
    await flush();
    toolbars.apply('sub-1', {
      label: 'Tools',
      moreLabel: 'More',
      entries: [{ key: 'sources', label: 'Sources', opensMenu: true }],
    });
    const button = toolbar.querySelector<HTMLButtonElement>('button[data-lw-entry="sources"]') as HTMLButtonElement;

    button.click();
    await flush();
    expect(host.calls.at(-1)).toEqual({ method: 'slotOpen', args: ['sub-1', 'sources'] });
    expect(toolbar.openKey).toBe('sources');

    const submenu: LwSlotView = {
      label: 'Sources',
      moreLabel: 'More',
      header: { title: 'Sources', detail: 'Two kinds' },
      entries: [
        { key: 'import', label: 'Import', icon: 'add', shortcut: 'Ctrl+I', group: '0' },
        { key: 'locked', label: 'Locked', group: '1', disabled: true },
      ],
    };
    toolbars.apply('sub-2', submenu);
    const menu = document.body.querySelector(LW_MENU_TAG) as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.querySelector('.lw-menu-header-title')?.textContent).toBe('Sources');
    expect(menu.getAttribute('aria-label')).toBe('Sources, Two kinds');
    expect(menu.querySelector('.lw-menu-separator')).not.toBeNull();
    expect(menu.classList.contains('lw-menu--leading')).toBe(true);
    const [item, locked] = [...menu.querySelectorAll<HTMLElement>(LW_MENU_ITEM_TAG)];
    expect(item.getAttribute('label')).toBe('Import');
    expect(item.getAttribute('shortcut')).toBe('Ctrl+I');
    expect(locked.hasAttribute('disabled')).toBe(true);

    item.click();

    const activated = host.calls.findIndex((call) => call.method === 'slotActivate');
    const unwatched = host.calls.findIndex((call) => call.method === 'slotUnwatch' && call.args[0] === 'sub-2');
    expect(host.calls[activated]).toEqual({ method: 'slotActivate', args: ['sub-2', 'import'] });
    expect(unwatched).toBeGreaterThan(activated);
    expect(document.body.querySelector(LW_MENU_TAG)).toBeNull();
    expect(toolbar.openKey).toBeNull();
  });

  it('opens nothing when the host answers nothing for the entry', async () => {
    const toolbars = createToolbars();
    const host = { ...fakeHost(), slotOpen: () => Promise.resolve(undefined) };
    toolbars.connect(host);
    const toolbar = place('acme/toolbar', {});
    await flush();
    toolbars.apply('sub-1', {
      label: 'Tools',
      moreLabel: 'More',
      entries: [{ key: 'sources', label: 'Sources', opensMenu: true }],
    });

    toolbar.querySelector<HTMLButtonElement>('button[data-lw-entry="sources"]')?.click();
    await flush();

    expect(toolbar.openKey).toBeNull();
    expect(document.body.querySelector(LW_MENU_TAG)).toBeNull();
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

describe('the entry a frame is told and the entry the toolbar draws', () => {
  it('carry the same fields, apart from the context menu only the page knows of', () => {
    expectTypeOf<Same<Omit<LwToolbarEntry, 'hasContextMenu'>, LwSlotEntry>>().toEqualTypeOf<true>();
  });
});
