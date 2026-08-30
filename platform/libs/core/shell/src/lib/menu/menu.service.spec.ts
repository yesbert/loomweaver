import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { MenuService, whenMatches } from './menu.service';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { CommandService } from '../commands/command.service';
import {
  defineLwMenu,
  LW_MENU_DISMISS,
  LW_MENU_ITEM_TAG,
  LW_MENU_SELECT,
  LW_MENU_TAG,
} from '../elements/menu/lw-menu.element';

defineLwMenu();

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        menu: { close: 'Close', others: 'Close others', pinned: 'Pinned' },
        cmd: { close: 'Close tab' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

describe('whenMatches', () => {
  const context = { targetKind: 'content-tab', pinned: false, closable: true };

  it('matches when there is no when clause', () => {
    expect(whenMatches(undefined, context)).toBe(true);
  });

  it('matches when every when key equals the context', () => {
    expect(whenMatches({ closable: true }, context)).toBe(true);
    expect(whenMatches({ closable: true, pinned: false }, context)).toBe(true);
  });

  it('does not match when any when key differs', () => {
    expect(whenMatches({ pinned: true }, context)).toBe(false);
    expect(whenMatches({ closable: true, pinned: true }, context)).toBe(false);
  });

  it('does not match a key missing from the context', () => {
    expect(whenMatches({ group: 'editor' }, context)).toBe(false);
  });
});

describe('MenuService', () => {
  let service: MenuService;
  let registry: ContributionRegistry;
  let commands: CommandService;
  const context: MenuContext = {
    targetKind: 'content-tab',
    closable: true,
    pinned: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [transloco()] });
    service = TestBed.inject(MenuService);
    registry = TestBed.inject(ContributionRegistry);
    commands = TestBed.inject(CommandService);
    document.body.replaceChildren();
  });

  afterEach(() => service.close());

  function menu(): HTMLElement | null {
    return document.body.querySelector(LW_MENU_TAG);
  }

  function items(): HTMLElement[] {
    return [
      ...(menu()?.querySelectorAll(LW_MENU_ITEM_TAG) ?? []),
    ] as HTMLElement[];
  }

  it('does nothing when the slot has no matching items', () => {
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'other/slot', command: 'c.close' });

    service.open('content/tab/context', context, { x: 10, y: 10 });

    expect(menu()).toBeNull();
    expect(document.body.classList.contains('lw-menu-open')).toBe(false);
  });

  it('renders a popover for the slot and marks the body while open', () => {
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'content/tab/context', command: 'c.close' });

    service.open('content/tab/context', context, { x: 20, y: 30 });

    const items0 = items();
    expect(items0).toHaveLength(1);
    expect(items0[0].getAttribute('command')).toBe('c.close');
    expect(items0[0].getAttribute('label')).toBe('Close tab');
    expect(document.body.classList.contains('lw-menu-open')).toBe(true);
  });

  it('filters by when and sorts by group then order, inserting a separator between groups', () => {
    registry.addCommand({
      id: 'c.a',
      title: 'menu.close',
      run: () => undefined,
    });
    registry.addCommand({
      id: 'c.b',
      title: 'menu.others',
      run: () => undefined,
    });
    registry.addCommand({
      id: 'c.hidden',
      title: 'menu.pinned',
      run: () => undefined,
    });
    registry.addMenuItem({
      menu: 'm',
      command: 'c.b',
      group: '2_second',
      order: 0,
    });
    registry.addMenuItem({
      menu: 'm',
      command: 'c.a',
      group: '1_first',
      order: 0,
    });
    registry.addMenuItem({
      menu: 'm',
      command: 'c.hidden',
      when: { pinned: true },
    });

    service.open('m', context, { x: 0, y: 0 });

    expect(items().map((index) => index.getAttribute('command'))).toEqual([
      'c.a',
      'c.b',
    ]);
    expect(menu()?.querySelector('[role="separator"]')).not.toBeNull();
  });

  it('drops a menu item whose command does not resolve instead of rendering its raw id', () => {
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.close' });
    registry.addMenuItem({ menu: 'm', command: 'c.omitted' });

    service.open('m', context, { x: 0, y: 0 });

    const rendered = items();
    expect(rendered.map((index) => index.getAttribute('command'))).toEqual(['c.close']);
    expect(rendered.some((index) => index.getAttribute('label') === 'c.omitted')).toBe(
      false,
    );
  });

  it('reflects the command icon + shortcut hints and the leading column', () => {
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      icon: 'x',
      shortcut: 'mod+w',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.close' });

    service.open('m', context, { x: 0, y: 0 });

    expect(items()[0].getAttribute('icon')).toBe('x');
    expect(items()[0].getAttribute('shortcut')).toBeTruthy();
    expect(menu()?.classList.contains('lw-menu--leading')).toBe(true);
  });

  it('renders a checkbox item and reflects its checked state from the context', () => {
    registry.addCommand({
      id: 'c.pin',
      title: 'menu.pinned',
      run: () => undefined,
    });
    registry.addMenuItem({
      menu: 'm',
      command: 'c.pin',
      checkedWhen: { closable: true },
    });

    service.open('m', context, { x: 0, y: 0 });

    const item = items()[0];
    expect(item.hasAttribute('checkbox')).toBe(true);
    expect(item.hasAttribute('checked')).toBe(true);
  });

  it('runs the selected item command with the context and closes', () => {
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.close' });
    const execute = vi
      .spyOn(commands, 'execute')
      .mockImplementation(() => undefined);

    service.open('m', context, { x: 0, y: 0 });
    menu()?.dispatchEvent(
      new CustomEvent(LW_MENU_SELECT, { detail: { command: 'c.close' } }),
    );

    expect(execute).toHaveBeenCalledWith('c.close', context);
    expect(menu()).toBeNull();
    expect(document.body.classList.contains('lw-menu-open')).toBe(false);
  });

  it('runs an inline handler for an item without a command', () => {
    const run = vi.fn();
    registry.addMenuItem({ menu: 'm', title: 'menu.close', run });

    service.open('m', context, { x: 0, y: 0 });
    menu()?.dispatchEvent(
      new CustomEvent(LW_MENU_SELECT, { detail: { command: '__inline-0' } }),
    );

    expect(run).toHaveBeenCalledWith(context);
  });

  it('swallows and logs an inline handler error', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    registry.addMenuItem({
      menu: 'm',
      title: 'menu.close',
      run: () => {
        throw new Error('boom');
      },
    });

    service.open('m', context, { x: 0, y: 0 });
    expect(() =>
      menu()?.dispatchEvent(
        new CustomEvent(LW_MENU_SELECT, { detail: { command: '__inline-0' } }),
      ),
    ).not.toThrow();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('ignores a select with a null command key', () => {
    const execute = vi
      .spyOn(commands, 'execute')
      .mockImplementation(() => undefined);
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.close' });

    service.open('m', context, { x: 0, y: 0 });
    menu()?.dispatchEvent(
      new CustomEvent(LW_MENU_SELECT, { detail: { command: null } }),
    );

    expect(execute).not.toHaveBeenCalled();
    expect(menu()).toBeNull();
  });

  it('closes on the dismiss event', () => {
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.close' });

    service.open('m', context, { x: 0, y: 0 });
    expect(menu()).not.toBeNull();
    menu()?.dispatchEvent(new CustomEvent(LW_MENU_DISMISS));

    expect(menu()).toBeNull();
  });

  it('closes on an outside pointerdown and restores focus to the opener', () => {
    vi.useFakeTimers();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const restore = vi.spyOn(opener, 'focus');
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.close' });

    service.open('m', context, { x: 0, y: 0 });
    vi.runAllTimers();

    document.dispatchEvent(new Event('pointerdown'));

    expect(menu()).toBeNull();
    expect(restore).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('keeps the menu open on a pointerdown inside it', () => {
    vi.useFakeTimers();
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.close' });

    service.open('m', context, { x: 0, y: 0 });
    vi.runAllTimers();
    items()[0].dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(menu()).not.toBeNull();
    vi.useRealTimers();
  });

  it('drops a run-only item without a title instead of rendering an empty label', () => {
    registry.addMenuItem({ menu: 'm', run: () => undefined });
    registry.addMenuItem({
      menu: 'm',
      title: 'menu.close',
      run: () => undefined,
    });

    service.open('m', context, { x: 0, y: 0 });

    expect(items().map((index) => index.getAttribute('label'))).toEqual(['Close']);
  });

  it('does not leak the outside listener of a menu replaced before its listener attached', () => {
    vi.useFakeTimers();
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.close' });

    service.open('m', context, { x: 0, y: 0 });
    service.open('m', context, { x: 5, y: 5 });
    vi.runAllTimers();
    items()[0].dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(menu()).not.toBeNull();
    vi.useRealTimers();
  });

  it('open replaces a previously open menu (only one at a time)', () => {
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'm', command: 'c.close' });

    service.open('m', context, { x: 0, y: 0 });
    service.open('m', context, { x: 5, y: 5 });

    expect(document.body.querySelectorAll(LW_MENU_TAG)).toHaveLength(1);
  });

  it('close is a no-op when nothing is open', () => {
    expect(() => service.close()).not.toThrow();
  });

  describe('a heading naming what the menu was opened against', () => {
    function open(header?: {
      title: string;
      detail?: string;
      icon?: string;
      initials?: string;
    }): void {
      registry.addCommand({
        id: 'c.close',
        title: 'cmd.close',
        run: () => undefined,
      });
      registry.addMenuItem({ menu: 'm', command: 'c.close' });
      service.open('m', context, { x: 0, y: 0 }, { header });
    }

    function heading(): HTMLElement | null | undefined {
      return menu()?.querySelector('.lw-menu-header');
    }

    it('draws no heading where none is given', () => {
      open();
      expect(heading()).toBeNull();
      expect(menu()?.getAttribute('aria-label')).toBeNull();
    });

    it('draws the name, its second line and its mark above the first entry', () => {
      open({ title: 'menu.close', detail: 'ada@example.com', initials: 'AL' });

      expect(heading()?.querySelector('.lw-menu-header-title')?.textContent).toBe(
        'Close',
      );
      expect(
        heading()?.querySelector('.lw-menu-header-detail')?.textContent,
      ).toBe('ada@example.com');
      expect(heading()?.querySelector('.lw-menu-header-mark')?.textContent).toBe(
        'AL',
      );
      expect(menu()?.firstElementChild).toBe(heading());
    });

    it('names the menu once and keeps the heading out of the entries', () => {
      open({ title: 'menu.close', detail: 'ada@example.com' });

      expect(menu()?.getAttribute('aria-label')).toBe('Close, ada@example.com');
      expect(heading()?.getAttribute('aria-hidden')).toBe('true');
      expect(heading()?.getAttribute('role')).toBeNull();
      expect(items()).toHaveLength(1);
    });

    it('draws an icon where no initials are given', () => {
      open({ title: 'menu.close', icon: 'user' });

      expect(
        heading()?.querySelector('lw-icon')?.getAttribute('name'),
      ).toBe('user');
    });
  });

  describe('anchoring and the control that opened the menu', () => {
    function slot(): HTMLElement {
      registry.addCommand({
        id: 'c.close',
        title: 'cmd.close',
        run: () => undefined,
      });
      registry.addMenuItem({ menu: 'm', command: 'c.close' });
      const button = document.createElement('button');
      document.body.append(button);
      return button;
    }

    it('places a menu opened at a point where the point is', () => {
      slot();
      service.open('m', context, { x: 40, y: 60 });
      expect(menu()?.style.top).toBe('60px');
      expect(menu()?.style.left).toBe('40px');
    });

    it('places a menu opened against a control beside that control', () => {
      slot();
      service.open('m', context, {
        rect: { left: 0, top: 100, right: 40, bottom: 136 },
        side: 'right',
      });
      expect(menu()?.style.left).toBe('44px');
      expect(menu()?.style.top).toBe('100px');
    });

    it('reports the control the open menu belongs to and forgets it on close', () => {
      const button = slot();
      expect(service.openTrigger()).toBeNull();

      service.open('m', context, { x: 0, y: 0 }, { trigger: button });
      expect(service.openTrigger()).toBe(button);

      service.close();
      expect(service.openTrigger()).toBeNull();
    });

    it('moves the reported control when another menu opens', () => {
      const first = slot();
      const second = document.createElement('button');
      document.body.append(second);

      service.open('m', context, { x: 0, y: 0 }, { trigger: first });
      service.openList(
        [{ key: 'a', label: 'A' }],
        { x: 0, y: 0 },
        () => undefined,
        second,
      );

      expect(service.openTrigger()).toBe(second);
    });

    it('forgets the control and gives it the focus back when the menu is dismissed', () => {
      const button = slot();
      button.focus();
      const restore = vi.spyOn(button, 'focus');
      service.open('m', context, { x: 0, y: 0 }, { trigger: button });

      menu()?.dispatchEvent(new CustomEvent(LW_MENU_DISMISS, { bubbles: true }));

      expect(menu()).toBeNull();
      expect(restore).toHaveBeenCalled();
      expect(service.openTrigger()).toBeNull();
    });
  });

  describe('openList (ad-hoc list menu — content-tab overflow dropdown)', () => {
    it('does nothing for an empty list', () => {
      service.openList([], { x: 0, y: 0 }, () => undefined);
      expect(menu()).toBeNull();
    });

    it('renders one row per entry with its label + icon, marking the active row as a checked checkbox', () => {
      service.openList(
        [
          { key: 'doc/a', label: 'a.ts', icon: 'testbedDocument' },
          {
            key: 'doc/b',
            label: 'b.ts',
            icon: 'testbedDocument',
            active: true,
          },
        ],
        { x: 5, y: 5 },
        () => undefined,
      );

      const rows = items();
      expect(rows.map((index) => index.getAttribute('command'))).toEqual([
        'doc/a',
        'doc/b',
      ]);
      expect(rows.map((index) => index.getAttribute('label'))).toEqual([
        'a.ts',
        'b.ts',
      ]);
      expect(rows[0].getAttribute('icon')).toBe('testbedDocument');
      expect(rows[0].hasAttribute('checkbox')).toBe(false);
      expect(rows[1].hasAttribute('checkbox')).toBe(true);
      expect(rows[1].hasAttribute('checked')).toBe(true);
      expect(rows[1].hasAttribute('icon')).toBe(false);
      expect(menu()?.classList.contains('lw-menu--leading')).toBe(true);
    });

    it('renders checked-aware entries as checkboxes in both states', () => {
      service.openList(
        [
          { key: 'nav', label: 'Navigator', checked: true },
          { key: 'outline', label: 'Outline', checked: false },
        ],
        { x: 5, y: 5 },
        () => undefined,
      );

      const rows = items();
      expect(rows[0].hasAttribute('checkbox')).toBe(true);
      expect(rows[0].hasAttribute('checked')).toBe(true);
      expect(rows[1].hasAttribute('checkbox')).toBe(true);
      expect(rows[1].hasAttribute('checked')).toBe(false);
      expect(menu()?.classList.contains('lw-menu--leading')).toBe(true);
    });

    it('calls onPick with the chosen entry key and closes', () => {
      const pick = vi.fn();
      service.openList([{ key: 'doc/a', label: 'a.ts' }], { x: 0, y: 0 }, pick);
      menu()?.dispatchEvent(
        new CustomEvent(LW_MENU_SELECT, { detail: { command: 'doc/a' } }),
      );

      expect(pick).toHaveBeenCalledWith('doc/a');
      expect(menu()).toBeNull();
      expect(document.body.classList.contains('lw-menu-open')).toBe(false);
    });

    it('ignores a select with a null key but still closes', () => {
      const pick = vi.fn();
      service.openList([{ key: 'doc/a', label: 'a.ts' }], { x: 0, y: 0 }, pick);
      menu()?.dispatchEvent(
        new CustomEvent(LW_MENU_SELECT, { detail: { command: null } }),
      );

      expect(pick).not.toHaveBeenCalled();
      expect(menu()).toBeNull();
    });
  });
});
