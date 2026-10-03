import { defineLwIcon } from '../icon/lw-icon.element';
import { defineLwTooltip, LW_TOOLTIP_TAG } from '../tooltip/lw-tooltip.element';
import {
  defineLwToolbar,
  LW_TOOLBAR_CONTEXT,
  LW_TOOLBAR_SELECT,
  LW_TOOLBAR_TAG,
  LwToolbarContextDetail,
  LwToolbarElement,
  LwToolbarEntry,
  LwToolbarSelectDetail,
} from './lw-toolbar.element';
import { installLwToolbarHost, LwToolbarHost } from './toolbar-bridge';

defineLwIcon();
defineLwTooltip();
defineLwToolbar();

function mount(
  entries: readonly LwToolbarEntry[],
  attributes: Record<string, string> = {},
  children: readonly HTMLElement[] = [],
): LwToolbarElement {
  const toolbar = document.createElement(LW_TOOLBAR_TAG) as LwToolbarElement;
  for (const [name, value] of Object.entries(attributes)) {
    toolbar.setAttribute(name, value);
  }
  toolbar.append(...children);
  document.body.append(toolbar);
  toolbar.entries = entries;
  return toolbar;
}

function buttons(toolbar: LwToolbarElement): HTMLButtonElement[] {
  return [...toolbar.querySelectorAll<HTMLButtonElement>('button[data-lw-entry]')];
}

function cell(id: string, order: number, focusable = false): HTMLElement {
  const element = document.createElement(focusable ? 'button' : 'span');
  element.setAttribute('data-lw-cell', id);
  element.setAttribute('order', String(order));
  element.textContent = id;
  return element;
}

describe('<lw-toolbar>', () => {
  afterEach(() => {
    document.body.replaceChildren();
    installLwToolbarHost(undefined);
  });

  it('is a labelled toolbar that draws its entries in order, icons with a tooltip and text as text', () => {
    const toolbar = mount(
      [
        { key: 'b', label: 'Second', icon: 'add', order: 2, shortcut: 'Ctrl+B' },
        { key: 'a', label: 'First', order: 1 },
      ],
      { label: 'Row tools' },
    );

    expect(toolbar.getAttribute('role')).toBe('toolbar');
    expect(toolbar.getAttribute('aria-label')).toBe('Row tools');
    expect(buttons(toolbar).map((button) => button.getAttribute('aria-label'))).toEqual([
      'First',
      'Second',
    ]);
    const [text, icon] = buttons(toolbar);
    expect(text.textContent).toContain('First');
    expect(text.querySelector(LW_TOOLTIP_TAG)).toBeNull();
    expect(icon.querySelector('lw-icon')?.getAttribute('name')).toBe('add');
    expect(icon.querySelector(LW_TOOLTIP_TAG)?.getAttribute('text')).toBe('Second (Ctrl+B)');
  });

  it('announces a pressed state, a menu it opens and whether that menu is open', () => {
    const toolbar = mount([
      { key: 'on', label: 'On', pressed: true },
      { key: 'off', label: 'Off', pressed: false },
      { key: 'menu', label: 'More', opensMenu: true },
      { key: 'plain', label: 'Plain' },
    ]);
    const [on, off, menu, plain] = buttons(toolbar);

    expect(on.getAttribute('aria-pressed')).toBe('true');
    expect(off.getAttribute('aria-pressed')).toBe('false');
    expect(plain.hasAttribute('aria-pressed')).toBe(false);
    expect(menu.getAttribute('aria-haspopup')).toBe('menu');
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    expect(plain.hasAttribute('aria-haspopup')).toBe(false);

    toolbar.openKey = 'menu';
    expect(menu.getAttribute('aria-expanded')).toBe('true');
  });

  it('separates groups and keeps the plugin’s own cells in their place by order', () => {
    const toolbar = mount(
      [
        { key: 'a', label: 'A', group: '1', order: 0 },
        { key: 'b', label: 'B', group: '2', order: 10 },
      ],
      {},
      [cell('own', 5)],
    );

    const sequence = [...toolbar.children].map(
      (child) =>
        child.getAttribute('data-lw-entry') ??
        child.getAttribute('data-lw-cell') ??
        child.getAttribute('role'),
    );
    expect(sequence).toEqual(['a', 'own', 'separator', 'b']);
  });

  it('takes no space while it has nothing to draw, and appears once an entry arrives', () => {
    const toolbar = mount([]);
    expect(toolbar.hasAttribute('hidden')).toBe(true);

    toolbar.entries = [{ key: 'a', label: 'A' }];
    expect(toolbar.hasAttribute('hidden')).toBe(false);

    toolbar.entries = [];
    expect(toolbar.hasAttribute('hidden')).toBe(true);
  });

  it('reports an activation with the button that was pressed, and nothing for a disabled entry', () => {
    const toolbar = mount([
      { key: 'go', label: 'Go' },
      { key: 'no', label: 'No', disabled: true },
    ]);
    const selected: LwToolbarSelectDetail[] = [];
    toolbar.addEventListener(LW_TOOLBAR_SELECT, (event) => {
      selected.push((event as CustomEvent<LwToolbarSelectDetail>).detail);
    });
    const [go, no] = buttons(toolbar);

    go.click();
    no.click();

    expect(selected.map((detail) => detail.key)).toEqual(['go']);
    expect(selected[0].trigger).toBe(go);
    expect(no.disabled).toBe(true);
  });

  it('reports a right-click where the entry has a context menu, and leaves the browser’s menu otherwise', () => {
    const toolbar = mount([
      { key: 'with', label: 'With', hasContextMenu: true },
      { key: 'without', label: 'Without' },
    ]);
    const opened: LwToolbarContextDetail[] = [];
    toolbar.addEventListener(LW_TOOLBAR_CONTEXT, (event) => {
      opened.push((event as CustomEvent<LwToolbarContextDetail>).detail);
    });
    const [withMenu, without] = buttons(toolbar);

    const first = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 7, clientY: 9 });
    withMenu.dispatchEvent(first);
    const second = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    without.dispatchEvent(second);

    expect(opened).toEqual([{ key: 'with', x: 7, y: 9 }]);
    expect(first.defaultPrevented).toBe(true);
    expect(second.defaultPrevented).toBe(false);
  });

  it('is one tab stop whose arrow keys move between entries and focusable cells', () => {
    const toolbar = mount(
      [
        { key: 'a', label: 'A', order: 0 },
        { key: 'c', label: 'C', order: 2 },
      ],
      {},
      [cell('b', 1, true)],
    );
    const stops = [...toolbar.querySelectorAll<HTMLElement>('button')];
    expect(stops.map((stop) => stop.tabIndex)).toEqual([0, -1, -1]);

    stops[0].focus();
    toolbar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(stops[1]);
    toolbar.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(stops[2]);
    toolbar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(stops[0]);
    expect(stops.map((stop) => stop.tabIndex)).toEqual([0, -1, -1]);
  });

  it('hands itself to the installed host when it connects, tells it about changes, and lets go when it leaves', () => {
    const calls: string[] = [];
    const host: LwToolbarHost = {
      attach: (toolbar) => {
        calls.push(`attach:${toolbar.menu}`);
      },
      changed: (toolbar) => {
        calls.push(`changed:${toolbar.menu}:${JSON.stringify(toolbar.context)}`);
      },
      detach: (toolbar) => {
        calls.push(`detach:${toolbar.menu}`);
      },
    };
    installLwToolbarHost(host);
    const toolbar = mount([], { menu: 'acme/toolbar' });

    toolbar.context = { row: 1 };
    toolbar.setAttribute('menu', 'acme/other');
    toolbar.remove();

    expect(calls).toEqual([
      'attach:acme/toolbar',
      'changed:acme/toolbar:{"row":1}',
      'changed:acme/other:{"row":1}',
      'detach:acme/other',
    ]);
  });

  it('reaches a host installed after it connected', () => {
    const toolbar = mount([], { menu: 'late/toolbar' });
    const attached: string[] = [];
    installLwToolbarHost({
      attach: (candidate) => {
        attached.push(candidate.menu ?? '');
      },
      changed: () => undefined,
      detach: () => undefined,
    });

    expect(attached).toEqual(['late/toolbar']);
    expect(toolbar.isConnected).toBe(true);
  });

  it('reads a JSON context from its attribute and prefers a context set as a property', () => {
    const toolbar = mount([], { context: '{"row":"r1","kind":"note"}' });
    expect(toolbar.context).toEqual({ row: 'r1', kind: 'note' });

    toolbar.context = { row: 'r2' };
    expect(toolbar.context).toEqual({ row: 'r2' });
  });
});

describe('<lw-toolbar> folding', () => {
  let restore: () => void = () => undefined;

  afterEach(() => {
    restore();
    document.body.replaceChildren();
  });

  function stubLayout(toolbarWidth: number, widths: Record<string, number>): void {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const originalClient = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const id = this.getAttribute('data-lw-entry') ?? this.getAttribute('data-lw-cell');
      const width = this.hasAttribute('data-lw-fold') ? 28 : (id ? widths[id] ?? 0 : 0);
      return { width, right: width } as DOMRect;
    };
    Object.defineProperty(Element.prototype, 'clientWidth', {
      configurable: true,
      get(this: Element) {
        return this.tagName.toLowerCase() === LW_TOOLBAR_TAG ? toolbarWidth : 0;
      },
    });
    restore = () => {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
      if (originalClient) {
        Object.defineProperty(Element.prototype, 'clientWidth', originalClient);
      }
    };
  }

  it('folds from the end into a tray the fold control opens, cells whole, and unfolds when room returns', () => {
    stubLayout(100, { a: 30, b: 30, c: 30, d: 30 });
    const toolbar = mount(
      [
        { key: 'a', label: 'A', order: 0 },
        { key: 'b', label: 'B', order: 1 },
        { key: 'd', label: 'D', order: 3 },
      ],
      { label: 'Tools' },
      [cell('c', 2)],
    );
    toolbar.moreLabel = 'More';

    const inRow = () =>
      [...toolbar.children]
        .filter((child) => !child.classList.contains('lw-toolbar-tray'))
        .map((child) => child.getAttribute('data-lw-entry') ?? child.getAttribute('data-lw-cell') ?? 'fold');
    expect(inRow()).toEqual(['a', 'b', 'fold']);
    const tray = toolbar.querySelector<HTMLElement>('.lw-toolbar-tray') as HTMLElement;
    expect(tray.hidden).toBe(true);
    expect([...tray.children].map((child) => child.getAttribute('data-lw-cell') ?? child.getAttribute('data-lw-entry'))).toEqual(['c', 'd']);

    const control = toolbar.querySelector<HTMLButtonElement>('[data-lw-fold]') as HTMLButtonElement;
    expect(control.getAttribute('aria-label')).toBe('More');
    control.click();
    expect(tray.hidden).toBe(false);
    expect(control.getAttribute('aria-expanded')).toBe('true');
    toolbar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(tray.hidden).toBe(true);

    restore();
    stubLayout(400, { a: 30, b: 30, c: 30, d: 30 });
    toolbar.entries = [...toolbar.entries];
    expect(inRow()).toEqual(['a', 'b', 'c', 'd']);
    expect(toolbar.querySelector('[data-lw-fold]')).toBeNull();
  });

  it('suspends folding while it has no width to measure against', () => {
    stubLayout(0, { a: 30, b: 30 });
    const toolbar = mount([
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
    ]);

    expect(toolbar.querySelector('[data-lw-fold]')).toBeNull();
    expect(buttons(toolbar)).toHaveLength(2);
  });
});
