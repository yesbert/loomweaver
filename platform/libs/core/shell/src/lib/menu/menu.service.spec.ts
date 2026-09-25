import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MenuContext } from '@loomweaver/plugin-sdk';
import { MenuService } from './menu.service';
import { ContributionRegistry } from '../contributions/contribution-registry';
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
        cmd: { close: 'Close tab', profile: 'Profile' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

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

  it('closes what is open when its injector is destroyed, so the body is not left marked', () => {
    registry.addCommand({
      id: 'c.close',
      title: 'cmd.close',
      run: () => undefined,
    });
    registry.addMenuItem({ menu: 'content/tab/context', command: 'c.close' });
    service.open('content/tab/context', context, { x: 10, y: 10 });
    expect(document.body.classList.contains('lw-menu-open')).toBe(true);

    TestBed.resetTestingModule();

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

  it('hands a failing inline handler to the error handler, as a failing command is', () => {
    const errors = TestBed.inject(ErrorHandler);
    const handled = vi
      .spyOn(errors, 'handleError')
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
    expect(handled).toHaveBeenCalledWith(new Error('boom'));
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
      image?: string;
      command?: string;
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

      expect(
        heading()?.querySelector('.lw-menu-header-title')?.textContent,
      ).toBe('Close');
      expect(
        heading()?.querySelector('.lw-menu-header-detail')?.textContent,
      ).toBe('ada@example.com');
      expect(
        heading()?.querySelector('.lw-menu-header-mark')?.textContent,
      ).toBe('AL');
      expect(menu()?.firstElementChild).toBe(heading());
    });

    it('names the menu once and keeps the heading out of the entries', () => {
      open({ title: 'menu.close', detail: 'ada@example.com' });

      expect(menu()?.getAttribute('aria-label')).toBe('Close, ada@example.com');
      expect(heading()?.getAttribute('aria-hidden')).toBe('true');
      expect(heading()?.getAttribute('role')).toBeNull();
      expect(items()).toHaveLength(1);
    });

    it('draws a picture where one is given, in place of the initials', () => {
      open({
        title: 'menu.close',
        initials: 'AL',
        image: 'https://example.test/ada.png',
      });

      const mark = heading()?.querySelector('.lw-menu-header-mark');
      expect(
        mark?.querySelector<HTMLImageElement>('img')?.getAttribute('src'),
      ).toBe('https://example.test/ada.png');
      expect(mark?.textContent).toBe('');
    });

    it('gives way to the initials when the picture cannot be shown', () => {
      open({
        title: 'menu.close',
        detail: 'ada@example.com',
        initials: 'AL',
        image: 'https://example.test/ada.png',
      });
      const mark = heading()?.querySelector('.lw-menu-header-mark');

      mark?.querySelector('img')?.dispatchEvent(new Event('error'));

      expect(mark?.querySelector('img')).toBeNull();
      expect(mark?.textContent).toBe('AL');
      expect(menu()?.getAttribute('aria-label')).toBe('Close, ada@example.com');
    });

    it('draws an icon where no initials are given', () => {
      open({ title: 'menu.close', icon: 'user' });

      expect(heading()?.querySelector('lw-icon')?.getAttribute('name')).toBe(
        'user',
      );
    });

    describe('that leads to what it names', () => {
      function profile(): void {
        registry.addCommand({
          id: 'c.profile',
          title: 'cmd.profile',
          run: () => undefined,
        });
      }

      function press(key: string): void {
        menu()?.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true }),
        );
      }

      it('runs its command with the menu context on a click and closes the menu', () => {
        profile();
        const execute = vi
          .spyOn(commands, 'execute')
          .mockImplementation(() => undefined);
        open({ title: 'menu.close', command: 'c.profile' });

        heading()?.click();

        expect(execute).toHaveBeenCalledWith('c.profile', context);
        expect(menu()).toBeNull();
      });

      it('is reached first by the down arrow and runs on Enter and on Space', () => {
        profile();
        const execute = vi
          .spyOn(commands, 'execute')
          .mockImplementation(() => undefined);

        for (const key of ['Enter', ' ']) {
          open({ title: 'menu.close', command: 'c.profile' });
          press('ArrowDown');
          expect(document.activeElement).toBe(heading());
          press(key);
        }

        expect(execute).toHaveBeenCalledTimes(2);
        expect(execute).toHaveBeenNthCalledWith(2, 'c.profile', context);
      });

      it('is announced by what its command does while the menu keeps the name', () => {
        profile();
        open({
          title: 'menu.close',
          detail: 'ada@example.com',
          command: 'c.profile',
        });

        expect(menu()?.getAttribute('aria-label')).toBe(
          'Close, ada@example.com',
        );
        expect(heading()?.getAttribute('role')).toBe('menuitem');
        expect(heading()?.getAttribute('aria-label')).toBe('Profile');
        expect(heading()?.hasAttribute('aria-hidden')).toBe(false);
      });

      it('stays a plain heading the keyboard passes over when nothing registers its command', () => {
        const execute = vi
          .spyOn(commands, 'execute')
          .mockImplementation(() => undefined);
        open({ title: 'menu.close', command: 'c.missing' });

        expect(heading()?.getAttribute('role')).toBeNull();
        expect(heading()?.getAttribute('aria-hidden')).toBe('true');
        press('ArrowDown');
        expect(document.activeElement).toBe(items()[0]);
        heading()?.click();
        expect(execute).not.toHaveBeenCalled();
      });

      it('opens a menu whose only entry is the heading', () => {
        profile();
        service.open(
          'empty',
          context,
          { x: 0, y: 0 },
          { header: { title: 'menu.close', command: 'c.profile' } },
        );

        expect(heading()?.getAttribute('role')).toBe('menuitem');
      });

      it('still opens nothing when the heading cannot lead anywhere and no entry exists', () => {
        service.open(
          'empty',
          context,
          { x: 0, y: 0 },
          { header: { title: 'menu.close', command: 'c.missing' } },
        );

        expect(menu()).toBeNull();
      });
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

      menu()?.dispatchEvent(
        new CustomEvent(LW_MENU_DISMISS, { bubbles: true }),
      );

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

    it('renders one row per entry with its label and icon, marking the entry in effect with a check', () => {
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
      expect(rows[1].getAttribute('icon')).toBe('testbedDocument');
      expect(menu()?.classList.contains('lw-menu--checks')).toBe(true);
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
      expect(menu()?.classList.contains('lw-menu--checks')).toBe(true);
      expect(menu()?.classList.contains('lw-menu--leading')).toBe(false);
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
