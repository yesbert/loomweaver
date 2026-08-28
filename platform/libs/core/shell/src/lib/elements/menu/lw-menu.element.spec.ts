import {
  defineLwMenu,
  LW_MENU_DISMISS,
  LW_MENU_ITEM_TAG,
  LW_MENU_SELECT,
  LW_MENU_TAG,
} from './lw-menu.element';

function mount(
  items: readonly [command: string, label: string][],
): HTMLElement {
  const menu = document.createElement(LW_MENU_TAG);
  for (const [command, label] of items) {
    const item = document.createElement(LW_MENU_ITEM_TAG);
    item.setAttribute('command', command);
    item.setAttribute('label', label);
    menu.append(item);
  }
  document.body.append(menu);
  return menu;
}

const itemsOf = (menu: HTMLElement) => [
  ...menu.querySelectorAll<HTMLElement>('[role="menuitem"]'),
];
const key = (menu: HTMLElement, k: string) =>
  menu.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('<lw-menu> custom element', () => {
  beforeAll(() => defineLwMenu());
  afterEach(() => document.body.replaceChildren());

  it('registers both tags', () => {
    expect(customElements.get(LW_MENU_TAG)).toBeDefined();
    expect(customElements.get(LW_MENU_ITEM_TAG)).toBeDefined();
  });

  it('renders items as role=menuitem with their label', () => {
    const menu = mount([
      ['a', 'Close'],
      ['b', 'Close Others'],
    ]);
    const items = itemsOf(menu);
    expect(menu.getAttribute('role')).toBe('menu');
    expect(items.map((i) => i.textContent)).toEqual(['Close', 'Close Others']);
    expect(items[0].getAttribute('aria-disabled')).toBe('false');
  });

  it('emits lw-menu-select with the command when an item is clicked', () => {
    const menu = mount([
      ['a', 'Close'],
      ['b', 'Others'],
    ]);
    const onSelect = vi.fn();
    menu.addEventListener(LW_MENU_SELECT, (e) =>
      onSelect((e as CustomEvent).detail.command),
    );
    itemsOf(menu)[1].click();
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('highlights nothing until the first ArrowDown, which selects the first item on Enter', () => {
    const menu = mount([
      ['a', 'Close'],
      ['b', 'Others'],
    ]);
    const onSelect = vi.fn();
    menu.addEventListener(LW_MENU_SELECT, (e) =>
      onSelect((e as CustomEvent).detail.command),
    );

    key(menu, 'Enter');
    expect(onSelect).not.toHaveBeenCalled();

    key(menu, 'ArrowDown');
    key(menu, 'Enter');
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('skips disabled items when navigating and does not activate them', () => {
    const menu = mount([['a', 'Close']]);
    const disabled = document.createElement(LW_MENU_ITEM_TAG);
    disabled.setAttribute('command', 'x');
    disabled.setAttribute('label', 'Nope');
    disabled.setAttribute('disabled', '');
    menu.append(disabled);
    const onSelect = vi.fn();
    menu.addEventListener(LW_MENU_SELECT, onSelect);
    disabled.click();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('emits lw-menu-dismiss on Escape', () => {
    const menu = mount([['a', 'Close']]);
    const onDismiss = vi.fn();
    menu.addEventListener(LW_MENU_DISMISS, onDismiss);
    key(menu, 'Escape');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  function mountItem(attrs: Record<string, string>): HTMLElement {
    const menu = document.createElement(LW_MENU_TAG);
    const item = document.createElement(LW_MENU_ITEM_TAG);
    for (const [name, value] of Object.entries(attrs)) {
      item.setAttribute(name, value);
    }
    menu.append(item);
    document.body.append(menu);
    return item;
  }

  it('renders a leading icon when `icon` is set', () => {
    const item = mountItem({ command: 'a', label: 'Reveal', icon: 'search' });
    expect(
      item.querySelector('.lw-menu-item-lead lw-icon')?.getAttribute('name'),
    ).toBe('search');
    expect(item.querySelector('.lw-menu-item-label')?.textContent).toBe(
      'Reveal',
    );
  });

  it('renders a trailing, aria-hidden shortcut hint', () => {
    const item = mountItem({ command: 'a', label: 'Palette', shortcut: '⌘K' });
    const hint = item.querySelector('.lw-menu-item-shortcut');
    expect(hint?.textContent).toBe('⌘K');
    expect(hint?.getAttribute('aria-hidden')).toBe('true');
    expect(item.querySelector('.lw-menu-item-label')?.textContent).toBe(
      'Palette',
    );
  });

  it('a checkbox item is role=menuitemcheckbox and reflects checked with a check indicator', () => {
    const unchecked = mountItem({
      command: 'shell.tab.togglePin',
      label: 'Pinned',
      checkbox: '',
    });
    expect(unchecked.getAttribute('role')).toBe('menuitemcheckbox');
    expect(unchecked.getAttribute('aria-checked')).toBe('false');
    expect(unchecked.querySelector('.lw-menu-item-lead lw-icon')).toBeNull();

    const checked = mountItem({
      command: 'shell.tab.togglePin',
      label: 'Pinned',
      checkbox: '',
      checked: '',
    });
    expect(checked.getAttribute('aria-checked')).toBe('true');
    expect(
      checked.querySelector('.lw-menu-item-lead lw-icon')?.getAttribute('name'),
    ).toBe('check');
  });

  it('activating a checkbox item still emits its command (role^=menuitem match)', () => {
    const item = mountItem({
      command: 'shell.tab.togglePin',
      label: 'Pinned',
      checkbox: '',
    });
    const onSelect = vi.fn();
    item.parentElement?.addEventListener(LW_MENU_SELECT, (e) =>
      onSelect((e as CustomEvent).detail.command),
    );
    item.click();
    expect(onSelect).toHaveBeenCalledWith('shell.tab.togglePin');
  });

  it('openAt positions the menu at the point, clamped into the viewport', () => {
    const menu = mount([
      ['a', 'Close'],
    ]) as import('./lw-menu.element').LwMenuElement;
    menu.openAt(120, 80);
    expect(menu.style.left).toBe('120px');
    expect(menu.style.top).toBe('80px');
    menu.openAt(5000, 5000);
    expect(menu.style.left).toBe(`${window.innerWidth - 4}px`);
    expect(menu.style.top).toBe(`${window.innerHeight - 4}px`);
  });
});
