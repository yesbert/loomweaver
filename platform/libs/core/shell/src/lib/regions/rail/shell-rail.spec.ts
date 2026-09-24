import {
  ApplicationRef,
  Provider,
  WritableSignal,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { ShellRail } from './shell-rail';
import { LayoutRegion, provideLayout } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../auth/auth-context';
import { RailItem } from '../../foundation/rail-item';
import { RailLabelsService } from './rail-labels.service';
import { RAIL_ITEM_CONTEXT_MENU } from './rail-context-menu';
import { LW_TOOLTIP_TAG } from '../../elements/tooltip/lw-tooltip.element';
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
        rail: {
          label: 'Ribbon',
          labelLeft: 'Left ribbon',
          labelRight: 'Right ribbon',
        },
        cmd: { reset: 'Reset' },
      },
    },
    translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
    preloadLangs: true,
  });
}

interface RailSetup {
  readonly auth?: WritableSignal<AuthSnapshot>;
  readonly region?: LayoutRegion;
  readonly providers?: Provider[];
  readonly arrange?: (registry: ContributionRegistry) => void;
}

function renderRail(
  items: readonly RailItem[],
  setup: RailSetup = {},
): ComponentFixture<ShellRail> {
  TestBed.configureTestingModule({
    imports: [ShellRail, transloco()],
    providers: [
      { provide: AUTH_SOURCE, useValue: setup.auth ?? signal(ANONYMOUS) },
      ...(setup.providers ?? []),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  setup.arrange?.(registry);
  for (const item of items) {
    registry.addRailItem(item);
  }
  const fixture = TestBed.createComponent(ShellRail);
  fixture.componentRef.setInput('region', setup.region ?? railRegion);
  fixture.detectChanges();
  return fixture;
}

function buttonsOf(fixture: ComponentFixture<ShellRail>) {
  return fixture.nativeElement.querySelectorAll(
    'button',
  ) as NodeListOf<HTMLButtonElement>;
}

describe('ShellRail', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders rail command items and runs them on click', () => {
    let ran = 0;
    const buttons = buttonsOf(
      renderRail([
        {
          id: 'r',
          rail: 'activity',
          icon: 'reset',
          title: 'cmd.reset',
          run: () => (ran += 1),
        },
      ]),
    );

    expect(buttons.length).toBe(1);
    buttons[0].click();
    expect(ran).toBe(1);
  });

  it('shows only items targeting this rail', () => {
    const buttons = buttonsOf(
      renderRail([
        {
          id: 'other',
          rail: 'other-rail',
          icon: 'reset',
          title: 'cmd.reset',
          run: () => undefined,
        },
      ]),
    );

    expect(buttons.length).toBe(0);
  });

  describe('bands', () => {
    const banded = (id: string, anchor?: 'top' | 'bottom'): RailItem => ({
      id,
      rail: 'activity',
      icon: 'reset',
      title: 'cmd.reset',
      anchor,
      run: () => undefined,
    });

    function bandsOf(...items: RailItem[]) {
      const fixture = renderRail(items);
      const root = fixture.nativeElement as HTMLElement;
      return {
        scroll: root.querySelector<HTMLElement>('[data-testid="rail-scroll"]'),
        anchored: root.querySelector<HTMLElement>(
          '[data-testid="rail-anchored"]',
        ),
      };
    }

    function itemsIn(band: HTMLElement | null) {
      return [...(band?.querySelectorAll('button') ?? [])].map((button) =>
        button.getAttribute('data-rail-item'),
      );
    }

    it('renders top-anchored items in the scrolling band and the rest in the anchored one', () => {
      const bands = bandsOf(banded('settings', 'bottom'), banded('files'));

      expect(itemsIn(bands.scroll)).toEqual(['files']);
      expect(itemsIn(bands.anchored)).toEqual(['settings']);
    });

    it('lets the entries above the anchored band scroll', () => {
      const bands = bandsOf(banded('files'), banded('settings', 'bottom'));

      expect(bands.scroll?.classList).toContain('overflow-y-auto');
      expect(bands.anchored?.contains(bands.scroll)).toBe(false);
      expect(bands.scroll?.contains(bands.anchored)).toBe(false);
    });

    it('draws no anchored band when nothing is anchored', () => {
      const bands = bandsOf(banded('files'), banded('search'));

      expect(itemsIn(bands.scroll)).toEqual(['files', 'search']);
      expect(bands.anchored).toBeNull();
    });

    it('brings a focused entry into view', () => {
      const fixture = renderRail([banded('files')]);
      const button = fixture.nativeElement.querySelector(
        'button',
      ) as HTMLButtonElement;
      const scrolled = vi.fn();
      button.scrollIntoView = scrolled;

      button.dispatchEvent(new FocusEvent('focus'));

      expect(scrolled).toHaveBeenCalledWith({ block: 'nearest' });
    });
  });

  describe('names under the icons', () => {
    const entry = (id: string, title: string): RailItem => ({
      id,
      rail: 'activity',
      icon: 'reset',
      title,
      run: () => undefined,
    });

    function labelledSetup(...items: RailItem[]) {
      const fixture = renderRail(items, {
        arrange: () =>
          TestBed.inject(RailLabelsService).setLabelled('activity', true),
      });
      TestBed.inject(ApplicationRef).tick();
      return fixture;
    }

    function labelsOf(fixture: { nativeElement: HTMLElement }) {
      return [
        ...fixture.nativeElement.querySelectorAll('[data-rail-label]'),
      ].map((label) => label.textContent?.trim());
    }

    it('draws the name of every entry when the rail is switched on', () => {
      const fixture = labelledSetup(entry('r', 'cmd.reset'));

      expect(labelsOf(fixture)).toEqual(['Reset']);
    });

    it('draws no name while the rail is switched off', () => {
      const fixture = renderRail([entry('r', 'cmd.reset')]);

      expect(labelsOf(fixture)).toEqual([]);
    });

    it('drops the tooltip of an entry whose name is readable', () => {
      const fixture = labelledSetup(entry('r', 'cmd.reset'));

      expect(
        fixture.nativeElement.querySelectorAll(LW_TOOLTIP_TAG).length,
      ).toBe(0);
    });

    it('keeps a picture and initials beside the name', () => {
      const fixture = labelledSetup(
        { ...entry('pic', 'cmd.reset'), image: '/logo.svg' },
        { ...entry('ini', 'cmd.reset'), initials: 'GH' },
      );

      expect(
        fixture.nativeElement.querySelectorAll('[data-testid="rail-picture"]')
          .length,
      ).toBe(1);
      expect(
        fixture.nativeElement.querySelectorAll('[data-testid="rail-initials"]')
          .length,
      ).toBe(1);
      expect(labelsOf(fixture)).toEqual(['Reset', 'Reset']);
    });
  });

  describe('landmark label', () => {
    const rightRegion: LayoutRegion = {
      id: 'activity-right',
      type: 'rail',
      dock: 'right',
    };

    function navLabelFor(
      region: LayoutRegion,
      ...declared: LayoutRegion[]
    ): string | null {
      TestBed.resetTestingModule();
      const fixture = renderRail([], {
        region,
        providers: [
          provideLayout({ regions: declared.length ? declared : [region] }),
        ],
      });
      const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
      return nav.getAttribute('aria-label');
    }

    it('names a lone rail without saying a side', () => {
      expect(navLabelFor(railRegion)).toBe('Ribbon');
      expect(navLabelFor(rightRegion)).toBe('Ribbon');
    });

    it('names each of two rails for its side, so the landmarks stay unique', () => {
      expect(navLabelFor(railRegion, railRegion, rightRegion)).toBe(
        'Left ribbon',
      );
      expect(navLabelFor(rightRegion, railRegion, rightRegion)).toBe(
        'Right ribbon',
      );
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
      const fixture = renderRail([gated('admin', { anyRole: ['admin'] })], {
        auth,
      });
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
      const fixture = renderRail([item], { auth });
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

    function picture(
      fixture: ComponentFixture<ShellRail>,
    ): HTMLImageElement | null {
      return fixture.nativeElement.querySelector(
        '[data-testid="rail-picture"]',
      );
    }

    function initials(
      fixture: ComponentFixture<ShellRail>,
    ): HTMLElement | null {
      return fixture.nativeElement.querySelector(
        '[data-testid="rail-initials"]',
      );
    }

    it('gives the mark the shape the picture takes', () => {
      const fixture = renderRail([withPicture({ image: undefined })]);

      expect(initials(fixture)?.className).toContain('lw-chrome-mark');
    });

    it('draws the picture in place of the mark and the icon', () => {
      const fixture = renderRail([withPicture()]);

      expect(picture(fixture)?.getAttribute('src')).toBe(
        'https://example.test/ada.png',
      );
      expect(picture(fixture)?.getAttribute('alt')).toBe('');
      expect(initials(fixture)).toBeNull();
      expect(fixture.nativeElement.querySelector('lw-icon')).toBeNull();
    });

    it('gives way to the mark when the picture cannot be shown', () => {
      const fixture = renderRail([withPicture()]);

      picture(fixture)?.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(picture(fixture)).toBeNull();
      expect(initials(fixture)?.textContent).toBe('AL');
    });

    it('gives way to the icon where the entry has no mark', () => {
      const fixture = renderRail([withPicture({ initials: undefined })]);

      picture(fixture)?.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(picture(fixture)).toBeNull();
      const icon = fixture.nativeElement.querySelector('lw-icon') as {
        name?: string;
      } | null;
      expect(icon?.name).toBe('reset');
    });

    it('keeps the entry announced by its title alone', () => {
      const fixture = renderRail([withPicture()]);

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
      return renderRail([item], {
        arrange: (registry) => {
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
          registry.addMenuItem({
            menu: RAIL_ITEM_CONTEXT_MENU,
            command: 'c.hide',
          });
        },
      });
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
        menuHeader: {
          title: 'Ada Lovelace',
          detail: 'ada@example.com',
          initials: 'AL',
        },
      });

      buttonsOf(fixture)[0].click();
      fixture.detectChanges();

      const menu = document.body.querySelector(LW_MENU_TAG);
      expect(menu?.querySelector('.lw-menu-header-title')?.textContent).toBe(
        'Ada Lovelace',
      );
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
