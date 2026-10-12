import {
  defineLwMenu,
  LW_MENU_DISMISS,
  LW_MENU_ITEM_TAG,
  LW_MENU_SELECT,
  LW_MENU_TAG,
  LwMenuElement,
  MenuAnchorRect,
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
    expect(items.map((index) => index.textContent)).toEqual(['Close', 'Close Others']);
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

  it('marks its Escape as handled, so a dialog around it stays open', () => {
    const menu = mount([['a', 'Close']]);
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });

    menu.dispatchEvent(escape);
    menu.dispatchEvent(tab);

    expect(escape.defaultPrevented).toBe(true);
    expect(tab.defaultPrevented).toBe(false);
  });

  function mountItem(attributes: Record<string, string>): HTMLElement {
    const menu = document.createElement(LW_MENU_TAG);
    const item = document.createElement(LW_MENU_ITEM_TAG);
    for (const [name, value] of Object.entries(attributes)) {
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
    expect(unchecked.querySelector('.lw-menu-item-check lw-icon')).toBeNull();

    const checked = mountItem({
      command: 'shell.tab.togglePin',
      label: 'Pinned',
      checkbox: '',
      checked: '',
    });
    expect(checked.getAttribute('aria-checked')).toBe('true');
    expect(
      checked.querySelector('.lw-menu-item-check lw-icon')?.getAttribute('name'),
    ).toBe('check');
  });

  describe('a checkbox item that has an icon', () => {
    function leading(item: HTMLElement): (string | null)[] {
      return [
        item.querySelector('.lw-menu-item-check lw-icon')?.getAttribute('name') ?? null,
        item.querySelector('.lw-menu-item-lead lw-icon')?.getAttribute('name') ?? null,
      ];
    }

    it('shows its check and then its icon when checked', () => {
      const item = mountItem({
        command: 'theme.dark',
        label: 'Dark',
        icon: 'themeDark',
        checkbox: '',
        checked: '',
      });

      expect(leading(item)).toEqual(['check', 'themeDark']);
      expect(item.getAttribute('aria-checked')).toBe('true');
      expect(item.querySelector('.lw-menu-item-check')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('keeps its icon with an empty check place when unchecked', () => {
      const item = mountItem({
        command: 'theme.light',
        label: 'Light',
        icon: 'themeLight',
        checkbox: '',
      });

      expect(leading(item)).toEqual([null, 'themeLight']);
      expect(item.querySelector('.lw-menu-item-check')).not.toBeNull();
      expect(item.getAttribute('aria-checked')).toBe('false');
    });

    it('leaves a plain item with an icon as it was', () => {
      const item = mountItem({ command: 'a', label: 'Reveal', icon: 'search' });

      expect(leading(item)).toEqual([null, 'search']);
      expect(item.getAttribute('role')).toBe('menuitem');
      expect(item.hasAttribute('aria-checked')).toBe(false);
    });
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

  it('passes over a heading: the keyboard reaches the first entry and a click on it does nothing', () => {
    const menu = mount([
      ['a', 'Profile'],
      ['b', 'Sign out'],
    ]);
    const header = document.createElement('div');
    header.className = 'lw-menu-header';
    header.textContent = 'Ada Lovelace';
    menu.prepend(header);
    const onSelect = vi.fn();
    menu.addEventListener(LW_MENU_SELECT, (e) =>
      onSelect((e as CustomEvent).detail.command),
    );

    header.click();
    expect(onSelect).not.toHaveBeenCalled();

    key(menu, 'ArrowDown');
    expect(document.activeElement).toBe(itemsOf(menu)[0]);

    key(menu, 'Enter');
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('openAt positions the menu at the point, clamped into the viewport', () => {
    const menu = mount([['a', 'Close']]) as LwMenuElement;
    menu.openAt(120, 80);
    expect(menu.style.left).toBe('120px');
    expect(menu.style.top).toBe('80px');
    menu.openAt(5000, 5000);
    expect(menu.style.left).toBe(`${window.innerWidth - 4}px`);
    expect(menu.style.top).toBe(`${window.innerHeight - 4}px`);
  });

  it('measures its full width again when placed a second time, so grown words are not cut off at the edge', () => {
    const menu = mount([['a', 'Sign out']]) as LwMenuElement;
    let natural = 180;
    menu.getBoundingClientRect = () => {
      const left = Number.parseFloat(menu.style.left || '0');
      const width = Math.min(natural, window.innerWidth - left);
      return { width, height: 40, top: 0, left, right: left + width, bottom: 40 } as DOMRect;
    };
    const nearTheRightEdge = window.innerWidth - 100;
    menu.openAt(nearTheRightEdge, 0);

    natural = 260;
    menu.openAt(nearTheRightEdge, 0);

    expect(Number.parseFloat(menu.style.left)).toBeLessThanOrEqual(
      window.innerWidth - 260,
    );
  });

  describe('openBeside', () => {
    const sized = (width: number, height: number) => {
      const menu = mount([['a', 'Sign out']]) as LwMenuElement;
      menu.getBoundingClientRect = () =>
        ({ width, height, top: 0, left: 0, right: width, bottom: height }) as DOMRect;
      return menu;
    };
    const rect = (
      left: number,
      top: number,
      width: number,
      height: number,
    ): MenuAnchorRect => ({
      left,
      top,
      right: left + width,
      bottom: top + height,
    });

    it('places the menu on the preferred side when it fits', () => {
      const menu = sized(200, 150);
      menu.openBeside(rect(0, 100, 40, 36), 'right');
      expect(menu.style.left).toBe('44px');
      expect(menu.style.top).toBe('100px');
    });

    it('flips to the opposite side when the preferred one has no room', () => {
      const menu = sized(200, 150);
      menu.openBeside(rect(window.innerWidth - 40, 100, 40, 36), 'right');
      expect(menu.style.left).toBe(`${window.innerWidth - 40 - 4 - 200}px`);
    });

    it('aligns to the far edge of the control rather than running off screen', () => {
      const menu = sized(200, 150);
      const control = rect(0, window.innerHeight - 68, 40, 36);
      menu.openBeside(control, 'right');
      expect(menu.style.left).toBe('44px');
      expect(menu.style.top).toBe(`${control.bottom - 150}px`);
    });

    it('never covers the control it was opened from', () => {
      const menu = sized(200, 150);
      const control = rect(window.innerWidth - 104, 0, 100, 32);
      menu.openBeside(control, 'bottom');
      expect(menu.style.top).toBe('36px');
      expect(menu.style.left).toBe(`${control.right - 200}px`);
    });
  });
  describe('a submenu nested in an entry', () => {
    function mountNested(): {
      menu: LwMenuElement;
      move: HTMLElement;
      submenu: LwMenuElement;
      steps: HTMLElement[];
    } {
      const menu = mount([['rename', 'Rename']]) as LwMenuElement;
      const move = document.createElement(LW_MENU_ITEM_TAG);
      move.setAttribute('label', 'Move');
      move.setAttribute('icon', 'sort');
      const submenu = document.createElement(LW_MENU_TAG) as LwMenuElement;
      for (const [command, label] of [
        ['up', 'Up'],
        ['down', 'Down'],
      ]) {
        const step = document.createElement(LW_MENU_ITEM_TAG);
        step.setAttribute('command', command);
        step.setAttribute('label', label);
        step.setAttribute('shortcut', '⇧↑');
        submenu.append(step);
      }
      move.append(submenu);
      menu.append(move);
      const remove = document.createElement(LW_MENU_ITEM_TAG);
      remove.setAttribute('command', 'remove');
      remove.setAttribute('label', 'Remove');
      menu.append(remove);
      return {
        menu,
        move,
        submenu,
        steps: [...submenu.querySelectorAll<HTMLElement>('lw-menu-item')],
      };
    }
    const press = (target: Element, k: string): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', {
        key: k,
        bubbles: true,
        cancelable: true,
      });
      target.dispatchEvent(event);
      return event;
    };
    const labelledName = (item: HTMLElement): string =>
      (item.getAttribute('aria-labelledby') ?? '')
        .split(' ')
        .map((id) => document.querySelector(`#${id}`)?.textContent ?? '')
        .join(' ');

    it('marks the entry as opening a menu, with a chevron, and names it by its own label', () => {
      const { move } = mountNested();

      expect(move.getAttribute('role')).toBe('menuitem');
      expect(move.getAttribute('aria-haspopup')).toBe('menu');
      expect(move.getAttribute('aria-expanded')).toBe('false');
      expect(move.querySelector(':scope > .lw-menu-item-submenu')).not.toBeNull();
      expect(
        move
          .querySelector(':scope > .lw-menu-item-submenu')
          ?.getAttribute('aria-hidden'),
      ).toBe('true');
      expect(labelledName(move)).toBe('Move');
    });

    it('keeps its submenu when the entry draws itself again', () => {
      const { move, submenu } = mountNested();

      move.setAttribute('label', 'Verschieben');

      expect(move.querySelector(':scope > lw-menu')).toBe(submenu);
      expect(labelledName(move)).toBe('Verschieben');
    });

    it('marks an entry whose submenu arrives after it was drawn', async () => {
      const menu = mount([['a', 'Resize']]);
      const entry = itemsOf(menu)[0];
      entry.append(document.createElement(LW_MENU_TAG));
      await Promise.resolve();

      expect(entry.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('stays hidden and leaves focus alone until its entry opens it', async () => {
      const { menu, submenu } = mountNested();
      await Promise.resolve();

      expect(submenu.hidden).toBe(true);
      expect(document.activeElement).toBe(menu);
    });

    it('counts only its own entries when moving', () => {
      const { menu, move } = mountNested();

      press(menu, 'ArrowDown');
      press(menu, 'ArrowDown');

      expect(document.activeElement).toBe(move);
      press(menu, 'ArrowDown');
      expect(document.activeElement?.getAttribute('command')).toBe('remove');
    });

    it('opens from the right arrow with focus on its first entry, and the left arrow closes it', () => {
      const { menu, move, submenu, steps } = mountNested();
      press(menu, 'ArrowDown');
      press(menu, 'ArrowDown');

      press(move, 'ArrowRight');

      expect(submenu.hidden).toBe(false);
      expect(move.getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement).toBe(steps[0]);

      press(steps[0], 'ArrowDown');
      expect(document.activeElement).toBe(steps[1]);

      const left = press(steps[1], 'ArrowLeft');

      expect(left.defaultPrevented).toBe(true);
      expect(submenu.hidden).toBe(true);
      expect(move.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(move);
    });

    it('opens from Enter and Space without choosing anything', () => {
      const { menu, move, submenu } = mountNested();
      const onSelect = vi.fn();
      menu.addEventListener(LW_MENU_SELECT, onSelect);
      press(menu, 'ArrowDown');
      press(menu, 'ArrowDown');

      press(move, 'Enter');
      expect(submenu.hidden).toBe(false);

      press(document.activeElement as Element, 'Escape');
      press(move, ' ');

      expect(submenu.hidden).toBe(false);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('closes only itself on Escape, which stays marked handled', () => {
      const { menu, move, submenu, steps } = mountNested();
      const onDismiss = vi.fn();
      menu.addEventListener(LW_MENU_DISMISS, onDismiss);
      press(menu, 'ArrowDown');
      press(menu, 'ArrowDown');
      press(move, 'ArrowRight');

      const escape = press(steps[0], 'Escape');

      expect(escape.defaultPrevented).toBe(true);
      expect(onDismiss).not.toHaveBeenCalled();
      expect(submenu.hidden).toBe(true);
      expect(document.activeElement).toBe(move);
    });

    it('dismisses the whole menu on Tab', () => {
      const { menu, move, steps } = mountNested();
      const onDismiss = vi.fn();
      menu.addEventListener(LW_MENU_DISMISS, onDismiss);
      press(menu, 'ArrowDown');
      press(menu, 'ArrowDown');
      press(move, 'ArrowRight');

      press(steps[0], 'Tab');

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('chooses an entry of the submenu once, and the outer menu hears it', () => {
      const { menu, move, steps } = mountNested();
      const onSelect = vi.fn();
      menu.addEventListener(LW_MENU_SELECT, (e) =>
        onSelect((e as CustomEvent).detail.command),
      );
      press(menu, 'ArrowDown');
      press(menu, 'ArrowDown');
      press(move, 'ArrowRight');

      press(steps[0], 'ArrowDown');
      press(steps[1], 'Enter');

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('down');
    });

    it('opens on a click of its entry and selects nothing; a click inside selects once', () => {
      const { menu, move, submenu, steps } = mountNested();
      const onSelect = vi.fn();
      menu.addEventListener(LW_MENU_SELECT, (e) =>
        onSelect((e as CustomEvent).detail.command),
      );

      move.click();

      expect(submenu.hidden).toBe(false);
      expect(onSelect).not.toHaveBeenCalled();

      steps[1].click();

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('down');
    });

    describe('with the pointer', () => {
      beforeEach(() => vi.useFakeTimers());
      afterEach(() => vi.useRealTimers());
      const hover = (target: Element) =>
        target.dispatchEvent(new Event('pointerover', { bubbles: true }));

      it('opens after a pause on its entry, and closes after one on a sibling', () => {
        const { menu, move, submenu } = mountNested();

        hover(move);
        expect(submenu.hidden).toBe(true);
        vi.advanceTimersByTime(200);
        expect(submenu.hidden).toBe(false);

        hover(itemsOf(menu)[0]);
        expect(submenu.hidden).toBe(false);
        vi.advanceTimersByTime(200);
        expect(submenu.hidden).toBe(true);
      });

      it('stays open when the pointer moves on into it', () => {
        const { menu, move, submenu, steps } = mountNested();
        hover(move);
        vi.advanceTimersByTime(200);

        hover(itemsOf(menu)[0]);
        hover(steps[0]);
        vi.advanceTimersByTime(200);

        expect(submenu.hidden).toBe(false);
      });

      it('does not open when the pointer only passes over its entry', () => {
        const { menu, move, submenu } = mountNested();

        hover(move);
        vi.advanceTimersByTime(50);
        hover(itemsOf(menu)[0]);
        vi.advanceTimersByTime(200);

        expect(submenu.hidden).toBe(true);
      });
    });

    describe('placement', () => {
      const box = (element: HTMLElement, r: MenuAnchorRect) => {
        element.getBoundingClientRect = () =>
          ({
            ...r,
            width: r.right - r.left,
            height: r.bottom - r.top,
          }) as DOMRect;
      };

      it('opens beside its entry, lined up with it', () => {
        const { menu, move, submenu } = mountNested();
        box(menu, { left: 100, right: 300, top: 50, bottom: 200 });
        box(move, { left: 100, right: 300, top: 90, bottom: 122 });
        submenu.getBoundingClientRect = () =>
          ({ width: 180, height: 80, top: 0, left: 0, right: 180, bottom: 80 }) as DOMRect;

        move.click();

        expect(Number.parseFloat(submenu.style.left)).toBeGreaterThan(300);
        expect(Number.parseFloat(submenu.style.left)).toBeLessThan(306);
        expect(Number.parseFloat(submenu.style.top)).toBeLessThanOrEqual(90);
        expect(Number.parseFloat(submenu.style.top)).toBeGreaterThan(80);
      });

      it('moves up only as far as the window needs, near the bottom edge', () => {
        const { menu, move, submenu } = mountNested();
        const bottom = window.innerHeight - 10;
        box(menu, { left: 100, right: 300, top: bottom - 120, bottom });
        box(move, { left: 100, right: 300, top: bottom - 60, bottom: bottom - 28 });
        submenu.getBoundingClientRect = () =>
          ({ width: 180, height: 140, top: 0, left: 0, right: 180, bottom: 140 }) as DOMRect;

        move.click();

        expect(Number.parseFloat(submenu.style.top)).toBe(
          window.innerHeight - 140 - 4,
        );
      });

      it('opens on the left where the right has no room', () => {
        const { menu, move, submenu } = mountNested();
        const right = window.innerWidth - 10;
        box(menu, { left: right - 200, right, top: 50, bottom: 200 });
        box(move, { left: right - 200, right, top: 90, bottom: 122 });
        submenu.getBoundingClientRect = () =>
          ({ width: 180, height: 80, top: 0, left: 0, right: 180, bottom: 80 }) as DOMRect;

        move.click();

        expect(Number.parseFloat(submenu.style.left) + 180).toBeLessThan(
          right - 200,
        );
      });
    });
  });
});
