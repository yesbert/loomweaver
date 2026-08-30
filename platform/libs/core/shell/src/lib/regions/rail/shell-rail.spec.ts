import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { ShellRail } from './shell-rail';
import { LayoutRegion } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { ActiveWorkspaceService } from '../../workspace/active-workspace.service';
import { WorkspaceService } from '../../workspace/workspace.service';
import { RailItem } from '../../foundation/rail-item';
import { RailItemsService } from './rail-items.service';
import { RAIL_ITEM_CONTEXT_MENU } from './rail-context-menu';
import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
  LW_MENU_TAG,
} from '../../elements/menu/lw-menu.element';

const railRegion: LayoutRegion = { id: 'activity', type: 'rail', dock: 'left' };

function transloco() {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {
        rail: { label: 'Ribbon', labelRight: 'Right ribbon' },
        cmd: { reset: 'Reset' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

function setup(auth: WritableSignal<AuthSnapshot>, ...items: RailItem[]) {
  TestBed.configureTestingModule({
    imports: [ShellRail, transloco()],
    providers: [{ provide: AUTH_SOURCE, useValue: auth }],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const item of items) {
    registry.addRailItem(item);
  }
  const fixture = TestBed.createComponent(ShellRail);
  fixture.componentRef.setInput('region', railRegion);
  fixture.detectChanges();
  return fixture;
}

function buttonsOf(fixture: ReturnType<typeof setup>) {
  return fixture.nativeElement.querySelectorAll(
    'button',
  ) as NodeListOf<HTMLButtonElement>;
}

function render(...items: RailItem[]) {
  return buttonsOf(setup(signal(ANONYMOUS), ...items));
}

describe('ShellRail', () => {
  it('renders rail command items and runs them on click', () => {
    let ran = 0;
    const buttons = render({
      id: 'r',
      rail: 'activity',
      icon: 'reset',
      title: 'cmd.reset',
      run: () => (ran += 1),
    });

    expect(buttons.length).toBe(1);
    buttons[0].click();
    expect(ran).toBe(1);
  });

  it('shows only items targeting this rail', () => {
    const buttons = render({
      id: 'other',
      rail: 'other-rail',
      icon: 'reset',
      title: 'cmd.reset',
      run: () => undefined,
    });

    expect(buttons.length).toBe(0);
  });

  it('renders top-anchored items first, then bottom-anchored ones pinned to the foot', () => {
    const item = (id: string, anchor?: 'top' | 'bottom'): RailItem => ({
      id,
      rail: 'activity',
      icon: 'reset',
      title: 'cmd.reset',
      anchor,
      run: () => undefined,
    });
    const buttons = render(item('settings', 'bottom'), item('files'));

    expect(buttons.length).toBe(2);
    expect([...buttons].map((b) => b.getAttribute('aria-label'))).toEqual([
      'Reset',
      'Reset',
    ]);
    expect(buttons[0].classList).not.toContain('mt-auto');
    expect(buttons[1].classList).toContain('mt-auto');
  });

  describe('landmark label', () => {
    function navLabelFor(region: LayoutRegion): string | null {
      TestBed.configureTestingModule({
        imports: [ShellRail, transloco()],
        providers: [{ provide: AUTH_SOURCE, useValue: signal(ANONYMOUS) }],
      });
      const fixture = TestBed.createComponent(ShellRail);
      fixture.componentRef.setInput('region', region);
      fixture.detectChanges();
      const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
      return nav.getAttribute('aria-label');
    }

    it('labels a left-docked rail with the default key', () => {
      expect(navLabelFor(railRegion)).toBe('Ribbon');
    });

    it('labels a right-docked rail distinctly so the landmarks stay unique', () => {
      expect(
        navLabelFor({ id: 'activity-right', type: 'rail', dock: 'right' }),
      ).toBe('Right ribbon');
    });
  });

  describe('auth gating', () => {
    const gated = (id: string, access: RailItem['access']): RailItem => ({
      id,
      rail: 'activity',
      icon: 'reset',
      title: 'cmd.reset',
      access,
      run: () => undefined,
    });
    const asAdmin: AuthSnapshot = {
      authenticated: true,
      roles: ['admin'],
      claims: {},
    };

    it('hides an item whose requirement is unmet (default hide mode)', () => {
      const auth = signal<AuthSnapshot>(ANONYMOUS);
      const fixture = setup(auth, gated('admin', { anyRole: ['admin'] }));
      expect(buttonsOf(fixture).length).toBe(0);

      auth.set(asAdmin);
      fixture.detectChanges();
      expect(buttonsOf(fixture).length).toBe(1);
    });

    it('keeps a disable-mode item visible but inert until the requirement is met', () => {
      let ran = 0;
      const auth = signal<AuthSnapshot>(ANONYMOUS);
      const item: RailItem = {
        ...gated('members', { authenticated: true, mode: 'disable' }),
        run: () => (ran += 1),
      };
      const fixture = setup(auth, item);
      const [button] = buttonsOf(fixture);

      expect(button.disabled).toBe(true);
      button.click();
      expect(ran).toBe(0);

      auth.set(asAdmin);
      fixture.detectChanges();
      expect(button.disabled).toBe(false);
      button.click();
      expect(ran).toBe(1);
    });
  });

  describe('workspace entries', () => {
    const switched: string[] = [];
    let activeId: WritableSignal<string>;

    function setupWorkspaces(active: string, ...items: RailItem[]) {
      localStorage.clear();
      switched.length = 0;
      activeId = signal(active);
      TestBed.configureTestingModule({
        imports: [ShellRail, transloco()],
        providers: [
          { provide: AUTH_SOURCE, useValue: signal(ANONYMOUS) },
          {
            provide: ActiveWorkspaceService,
            useValue: { id: activeId.asReadonly() },
          },
          {
            provide: WorkspaceService,
            useValue: {
              switchTo: (id: string) => {
                switched.push(id);
                return Promise.resolve();
              },
            },
          },
        ],
      });
      const registry = TestBed.inject(ContributionRegistry);
      for (const item of items) {
        registry.addRailItem(item);
      }
      const fixture = TestBed.createComponent(ShellRail);
      fixture.componentRef.setInput('region', railRegion);
      fixture.detectChanges();
      return fixture;
    }

    const entry = (id: string, workspace: string): RailItem => ({
      id,
      rail: 'activity',
      icon: 'reset',
      title: 'cmd.reset',
      workspace,
    });

    it('marks the entry of the active workspace and no other', () => {
      const fixture = setupWorkspaces(
        'beta',
        entry('a', 'alpha'),
        entry('b', 'beta'),
      );
      const [alpha, beta] = buttonsOf(fixture);

      expect(alpha.getAttribute('aria-current')).toBeNull();
      expect(beta.getAttribute('aria-current')).toBe('true');
    });

    it('moves the marking when the active workspace changes', () => {
      const fixture = setupWorkspaces(
        'alpha',
        entry('a', 'alpha'),
        entry('b', 'beta'),
      );

      activeId.set('beta');
      fixture.detectChanges();
      const [alpha, beta] = buttonsOf(fixture);

      expect(alpha.getAttribute('aria-current')).toBeNull();
      expect(beta.getAttribute('aria-current')).toBe('true');
    });

    it('leaves an ordinary item unmarked whichever workspace is active', () => {
      const fixture = setupWorkspaces('alpha', {
        id: 'plain',
        rail: 'activity',
        icon: 'reset',
        title: 'cmd.reset',
        run: () => undefined,
      });

      expect(buttonsOf(fixture)[0].getAttribute('aria-current')).toBeNull();
    });

    it('drops an entry the user hid from this rail and keeps it out after a rebuild', () => {
      const fixture = setupWorkspaces(
        'alpha',
        entry('a', 'alpha'),
        entry('b', 'beta'),
      );
      expect(buttonsOf(fixture)).toHaveLength(2);

      TestBed.inject(RailItemsService).hide('b');
      fixture.detectChanges();

      expect(buttonsOf(fixture)).toHaveLength(1);
      expect(buttonsOf(fixture)[0].getAttribute('aria-current')).toBe('true');
    });

    it('takes an item out of this rail once it is placed in another one', () => {
      const fixture = setupWorkspaces('alpha', entry('a', 'alpha'));
      TestBed.inject(RailItemsService).show('a', 'activity-right');
      fixture.detectChanges();

      expect(buttonsOf(fixture)).toHaveLength(0);
    });

    it('switches on click, ignoring a command the item also names', () => {
      let ran = 0;
      const fixture = setupWorkspaces('alpha', {
        ...entry('b', 'beta'),
        run: () => (ran += 1),
      });

      buttonsOf(fixture)[0].click();

      expect(switched).toEqual(['beta']);
      expect(ran).toBe(0);
    });
  });
  describe('an entry drawn as a picture', () => {
    const withPicture = (overrides: Partial<RailItem> = {}): RailItem => ({
      id: 'account',
      rail: 'activity',
      icon: 'reset',
      initials: 'AL',
      title: 'cmd.reset',
      image: 'https://example.test/ada.png',
      run: () => undefined,
      ...overrides,
    });

    function picture(fixture: ReturnType<typeof setup>): HTMLImageElement | null {
      return fixture.nativeElement.querySelector('[data-testid="rail-picture"]');
    }

    function initials(fixture: ReturnType<typeof setup>): HTMLElement | null {
      return fixture.nativeElement.querySelector('[data-testid="rail-initials"]');
    }

    it('draws the picture in place of the mark and the icon', () => {
      const fixture = setup(signal(ANONYMOUS), withPicture());

      expect(picture(fixture)?.getAttribute('src')).toBe(
        'https://example.test/ada.png',
      );
      expect(picture(fixture)?.getAttribute('alt')).toBe('');
      expect(initials(fixture)).toBeNull();
      expect(fixture.nativeElement.querySelector('lw-icon')).toBeNull();
    });

    it('gives way to the mark when the picture cannot be shown', () => {
      const fixture = setup(signal(ANONYMOUS), withPicture());

      picture(fixture)?.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(picture(fixture)).toBeNull();
      expect(initials(fixture)?.textContent).toBe('AL');
    });

    it('gives way to the icon where the entry has no mark', () => {
      const fixture = setup(
        signal(ANONYMOUS),
        withPicture({ initials: undefined }),
      );

      picture(fixture)?.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(picture(fixture)).toBeNull();
      const icon = fixture.nativeElement.querySelector('lw-icon') as {
        name?: string;
      } | null;
      expect(icon?.name).toBe('reset');
    });

    it('keeps the entry announced by its title alone', () => {
      const fixture = setup(signal(ANONYMOUS), withPicture());

      expect(buttonsOf(fixture)[0].getAttribute('aria-label')).toBe('Reset');
      expect(picture(fixture)?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('a menu opened by activating the item', () => {
    const account: RailItem = {
      id: 'account',
      rail: 'activity',
      icon: 'user',
      title: 'cmd.reset',
      anchor: 'bottom',
      menu: 'acme/account',
      menuTrigger: 'primary',
    };

    beforeAll(() => defineLwMenu());
    afterEach(() => document.body.querySelector(LW_MENU_TAG)?.remove());

    function setupMenu(item: RailItem) {
      TestBed.configureTestingModule({
        imports: [ShellRail, transloco()],
        providers: [{ provide: AUTH_SOURCE, useValue: signal(ANONYMOUS) }],
      });
      const registry = TestBed.inject(ContributionRegistry);
      registry.addCommand({
        id: 'c.signOut',
        title: 'cmd.reset',
        run: () => undefined,
      });
      registry.addCommand({
        id: 'c.hide',
        title: 'cmd.reset',
        run: () => undefined,
      });
      registry.addMenuItem({ menu: 'acme/account', command: 'c.signOut' });
      registry.addMenuItem({ menu: RAIL_ITEM_CONTEXT_MENU, command: 'c.hide' });
      registry.addRailItem(item);
      const fixture = TestBed.createComponent(ShellRail);
      fixture.componentRef.setInput('region', railRegion);
      fixture.detectChanges();
      return fixture;
    }

    function offered(): string[] {
      return [
        ...(document.body
          .querySelector(LW_MENU_TAG)
          ?.querySelectorAll(LW_MENU_ITEM_TAG) ?? []),
      ].map((item) => item.getAttribute('command') ?? '');
    }

    it('draws an item whose only purpose is its menu, and opens it on click', () => {
      const fixture = setupMenu(account);
      const button = buttonsOf(fixture)[0];

      expect(button.getAttribute('aria-haspopup')).toBe('menu');
      expect(button.getAttribute('aria-expanded')).toBe('false');

      button.click();
      fixture.detectChanges();

      expect(offered()).toEqual(['c.signOut']);
      expect(button.getAttribute('aria-expanded')).toBe('true');
    });

    it('heads the menu with what the entry stands for', () => {
      const fixture = setupMenu({
        ...account,
        menuHeader: { title: 'Ada Lovelace', detail: 'ada@example.com', initials: 'AL' },
      });

      buttonsOf(fixture)[0].click();
      fixture.detectChanges();

      const menu = document.body.querySelector(LW_MENU_TAG);
      expect(
        menu?.querySelector('.lw-menu-header-title')?.textContent,
      ).toBe('Ada Lovelace');
      expect(menu?.getAttribute('aria-label')).toBe(
        'Ada Lovelace, ada@example.com',
      );
    });

    it('keeps the workbench own entries on the right-click', () => {
      const fixture = setupMenu(account);

      buttonsOf(fixture)[0].dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true }),
      );

      expect(offered()).toEqual(['c.hide']);
    });

    it('offers both slots on the right-click when the item asks for both gestures', () => {
      const fixture = setupMenu({ ...account, menuTrigger: 'both' });

      buttonsOf(fixture)[0].dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true }),
      );

      expect(offered().toSorted((a, b) => a.localeCompare(b))).toEqual([
        'c.hide',
        'c.signOut',
      ]);
    });

    it('leaves an item that declares no gesture on the right-click alone', () => {
      const fixture = setupMenu({
        ...account,
        menuTrigger: undefined,
        run: () => undefined,
      });
      const button = buttonsOf(fixture)[0];

      expect(button.getAttribute('aria-haspopup')).toBeNull();

      button.click();
      fixture.detectChanges();

      expect(document.body.querySelector(LW_MENU_TAG)).toBeNull();
    });
  });
});
