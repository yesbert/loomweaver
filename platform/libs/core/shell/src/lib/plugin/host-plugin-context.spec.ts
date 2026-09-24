import { SurfaceRevealService } from '../views/surface-reveal.service';
import { PluginStateService } from './plugin-state.service';
import { WritableSignal, effect, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ANONYMOUS,
  AuthSnapshot,
  Capability,
  CapabilityError,
} from '@loomweaver/plugin-sdk';
import { HostPluginContext } from './host-plugin-context';
import { ContributionRegistry } from './contribution-registry';
import { DialogService } from '../dialog/dialog.service';
import { NotificationService } from '../notifications/notification.service';
import { SettingsService } from '../settings/settings.service';
import { VersionService } from '../version/version.service';
import { UpdateService } from '../update/update.service';
import { AUTH_SOURCE, AuthContext } from '../auth/auth-context';
import { MenuService } from '../menu/menu.service';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import {
  defineLwMenu,
  LW_MENU_ITEM_TAG,
} from '../elements/menu/lw-menu.element';
import { LayoutRegion } from '../layout/layout';
import { IconRegistry } from '../elements/icon/icon-registry';
import { ThemeRegistry } from '../theme/theme-registry';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { CommandInvocationService } from '../commands/command-invocation.service';
import { LeftOutChildren } from '../regions/pane/container/left-out-children';
import { CONTAINER_CHILD_REGION } from './surface-normalize';
import { VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';

class DummyComponent {}

const ALL: Capability[] = [
  'contributions',
  'ui',
  'host',
  'navigation',
  'session',
  'theme',
  'automation',
];

const REGIONS: readonly LayoutRegion[] = [
  { id: 'primary', type: 'panel', dock: 'left' },
  { id: 'main', type: 'content', dock: 'center' },
];

const PLUGIN_STRINGS = {
  en: { 'test-plugin': { menu: { open: 'Open' } } },
  de: { 'test-plugin': { menu: { open: 'Öffnen' } } },
};

function makeContext(
  granted: Capability[] = ALL,
  regions: readonly LayoutRegion[] = REGIONS,
  auth: WritableSignal<AuthSnapshot> = signal(ANONYMOUS),
  menus: 'stubbed' | 'drawn' = 'stubbed',
) {
  const menuStub = { openList: vi.fn() } as unknown as MenuService;
  TestBed.configureTestingModule({
    imports:
      menus === 'drawn'
        ? [
            TranslocoTestingModule.forRoot({
              langs: PLUGIN_STRINGS,
              translocoConfig: {
                availableLangs: ['en', 'de'],
                defaultLang: 'en',
              },
              preloadLangs: true,
            }),
          ]
        : [],
    providers: [
      { provide: AUTH_SOURCE, useValue: auth },
      ...(menus === 'stubbed'
        ? [{ provide: MenuService, useValue: menuStub }]
        : []),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  const dialogs = TestBed.inject(DialogService);
  const notifications = TestBed.inject(NotificationService);
  const settings = TestBed.inject(SettingsService);
  const version = TestBed.inject(VersionService);
  const update = TestBed.inject(UpdateService);
  const icons = TestBed.inject(IconRegistry);
  const themes = TestBed.inject(ThemeRegistry);
  const authContext = TestBed.inject(AuthContext);
  const menu = TestBed.inject(MenuService);
  const shown = signal<{ path: string } | null>(null);
  const tabs = {
    navigate: vi.fn(),
    open: vi.fn(),
    update: vi.fn(),
    close: vi.fn(),
    activeContent: () => shown(),
    hasUnsavedWork: () => true,
  } as unknown as ContentTabsService;
  const grantedSet = new Set(granted);
  const ctx = new HostPluginContext(
    'test-plugin',
    (capability) => grantedSet.has(capability),
    registry,
    dialogs,
    notifications,
    settings,
    version,
    update,
    tabs,
    regions,
    icons,
    authContext,
    menu,
    themes,
    TestBed.inject(SurfaceRevealService),
    TestBed.inject(PluginStateService),
    TestBed.inject(CommandInvocationService),
    TestBed.inject(LeftOutChildren),
  );
  return {
    ctx,
    shown,
    registry,
    dialogs,
    notifications,
    settings,
    version,
    update,
    icons,
    tabs,
    auth,
    menu,
    themes,
  };
}

function contribute(ctx: HostPluginContext): void {
  ctx.registerCommand({ id: 'c', title: 't', run: () => undefined });
  ctx.registerSurface({
    id: 'v',
    docks: ['primary'],
    title: 't',
    component: DummyComponent,
  });
  ctx.registerBarItem({
    id: 'b',
    bar: 'top-bar',
    slot: 'start',
    component: DummyComponent,
  });
  ctx.registerRailItem({
    id: 'r',
    rail: 'activity',
    icon: 'settings',
    title: 't',
    run: () => undefined,
  });
  ctx.registerSettingsSection({ id: 's', title: 's.title', rows: [] });
}

describe('HostPluginContext', () => {
  it('tracks every contribution and undoes them all on disposeAll', () => {
    const { ctx, registry, settings } = makeContext();

    contribute(ctx);
    expect(registry.commands()).toHaveLength(1);
    expect(registry.views()).toHaveLength(1);
    expect(registry.barItems()).toHaveLength(1);
    expect(registry.railItems()).toHaveLength(1);
    expect(settings.all()).toHaveLength(1);

    ctx.disposeAll();

    expect(registry.commands()).toHaveLength(0);
    expect(registry.views()).toHaveLength(0);
    expect(registry.barItems()).toHaveLength(0);
    expect(registry.railItems()).toHaveLength(0);
    expect(settings.all()).toHaveLength(0);
  });

  it('exposes the host ui facade (toast + openSettings) through ctx.ui', () => {
    const { ctx, dialogs, notifications } = makeContext();

    ctx.ui.toast({ message: 'hi' });
    ctx.ui.openSettings();

    expect(notifications.notifications()).toHaveLength(1);
    expect(dialogs.dialogs()).toHaveLength(1);
  });

  it('namespaces a plugin-supplied toast id with the plugin id (no host/cross-plugin id collision)', () => {
    const { ctx, notifications } = makeContext();

    ctx.ui.toast({ id: 'update', message: 'hi' });

    expect(notifications.notifications()[0].id).toBe('test-plugin.update');
  });

  it('ctx.ui.openMenu opens an ad-hoc menu and dispatches the picked item run (in-process)', () => {
    const { ctx, menu } = makeContext();
    const open = vi.fn();
    const remove = vi.fn();
    const openList = vi
      .spyOn(menu, 'openList')
      .mockImplementation((_entries, _at, _pick) => undefined);

    ctx.ui.openMenu(
      [
        { label: 'Open', icon: 'search', run: open },
        { label: 'Remove', run: remove },
      ],
      { x: 10, y: 20 },
    );

    expect(openList).toHaveBeenCalledTimes(1);
    const [entries, at, onPick] = openList.mock.calls[0];
    expect(at).toEqual({ x: 10, y: 20 });
    expect(entries).toEqual([
      { key: '0', label: 'Open', icon: 'search' },
      { key: '1', label: 'Remove', icon: undefined },
    ]);

    onPick('1');
    expect(remove).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
  });

  it('ctx.ui.openMenu translates an entry given a key and re-words it on a language change, and shows a literal as it is', () => {
    defineLwMenu();
    const { ctx, menu } = makeContext(ALL, REGIONS, signal(ANONYMOUS), 'drawn');
    const labels = () =>
      [...document.body.querySelectorAll(LW_MENU_ITEM_TAG)].map((item) =>
        item.getAttribute('label'),
      );

    onTestFinished(() => menu.close());
    ctx.ui.openMenu(
      [
        { label: 'test-plugin.menu.open', run: () => undefined },
        { label: 'Ada Lovelace', run: () => undefined },
      ],
      { x: 0, y: 0 },
    );
    expect(labels()).toEqual(['Open', 'Ada Lovelace']);

    TestBed.inject(TranslocoService).setActiveLang('de');
    expect(labels()).toEqual(['Öffnen', 'Ada Lovelace']);
  });

  it('ctx.ui.openMenu requires the "ui" capability (default-deny)', () => {
    const { ctx } = makeContext(['contributions']);
    expect(() =>
      ctx.ui.openMenu([{ label: 'x', run: () => undefined }], { x: 0, y: 0 }),
    ).toThrow(CapabilityError);
  });

  it('exposes read-only host facts (version + update) through ctx.host', () => {
    const { ctx, version, update } = makeContext();

    expect(ctx.host.version()).toBe(version.version());
    expect(ctx.host.updateAvailable()).toBe(update.updateAvailable());
    expect(ctx.host.updatesEnabled).toBe(update.enabled);
    expect(typeof ctx.host.checkForUpdate).toBe('function');
    expect(typeof ctx.host.activateUpdate).toBe('function');
  });

  it('exposes reactive session facts (login state + roles) through ctx.session', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const { ctx } = makeContext(ALL, REGIONS, auth);

    expect(ctx.session.authenticated()).toBe(false);
    expect(ctx.session.roles()).toEqual([]);
    expect(ctx.session.hasRole('admin')).toBe(false);

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    expect(ctx.session.authenticated()).toBe(true);
    expect(ctx.session.roles()).toEqual(['admin']);
    expect(ctx.session.hasRole('admin')).toBe(true);
  });

  it('rejects ctx.session access without the "session" capability', () => {
    const { ctx } = makeContext(['contributions', 'ui']);
    expect(() => ctx.session).toThrow(CapabilityError);
  });

  describe('container arrangement guard (dev-mode)', () => {
    it('registers the surface but names every unusable part of the arrangement', () => {
      const { ctx, registry } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'runs.detail',
        title: 't',
        routable: { path: 'runs/:id' },
        container: {
          children: ['graph'],
          initial: {
            columns: [{ tabs: ['graph'] }, { size: -5, tabs: ['monitor'] }],
          },
        },
      });

      expect(registry.contentRoutes()).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('not listed in children'),
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('positive percentage'),
      );
      warn.mockRestore();
    });

    it('stays silent for an arrangement that holds up', () => {
      const { ctx } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'runs.detail',
        title: 't',
        routable: { path: 'runs/:id' },
        container: {
          children: ['graph', 'monitor'],
          initial: { columns: [{ tabs: ['graph'] }, { tabs: ['monitor'] }] },
        },
      });

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('home-dock region guard (dev-mode)', () => {
    it('warns when a non-routable surface docks into a non-panel region (silent no-op today)', () => {
      const { ctx, registry } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'answer',
        docks: ['main'],
        title: 't',
        component: DummyComponent,
      });

      expect(registry.views()).toHaveLength(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"main"'));
      warn.mockRestore();
    });

    it('does not warn when the home dock is a panel region', () => {
      const { ctx } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'v',
        docks: ['primary'],
        title: 't',
        component: DummyComponent,
      });

      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('registers a follows surface without a warning — it is the facet tab itself', () => {
      const { ctx, registry } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'pricing',
        title: 't',
        routable: { path: 'programs/:id/pricing', follows: true },
        component: DummyComponent,
      });

      expect(registry.contentRoutes()).toHaveLength(1);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('does not warn for a docks:[] container-only child', () => {
      const { ctx, registry } = makeContext();
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'child',
        docks: [],
        title: 't',
        component: DummyComponent,
      });

      expect(registry.views()).toHaveLength(1);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('contributeIcons', () => {
    it('contributes icon names resolvable from the registry, and removes them on disposeAll', () => {
      const { ctx, icons } = makeContext();

      ctx.contributeIcons({ pluginGlyph: '<svg/>' });
      expect(icons.resolve('pluginGlyph')).toBe('<svg></svg>');

      ctx.disposeAll();
      expect(icons.resolve('pluginGlyph')).toBeUndefined();
    });
  });

  describe('contributeTheme', () => {
    it('is denied without the theme capability (default-deny)', () => {
      const { ctx } = makeContext(['contributions', 'ui']);
      expect(() => ctx.contributeTheme({ '--lw-brand': '#0e7490' })).toThrow(
        CapabilityError,
      );
    });

    it('registers with the theme capability and bumps the registry version, reverting on disposeAll', () => {
      const { ctx, themes } = makeContext();
      const before = themes.version();

      ctx.contributeTheme({ '--lw-brand': '#0e7490' });
      expect(themes.version()).toBe(before + 1);

      ctx.disposeAll();
      expect(themes.version()).toBe(before + 2);
    });

    it('passes dark-mode overrides through to the registry', () => {
      const { ctx, themes } = makeContext();
      const spy = vi.spyOn(themes, 'register');

      ctx.contributeTheme(
        { '--lw-surface': '#fff' },
        { '--lw-surface': '#111' },
      );

      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        { '--lw-surface': '#fff' },
        { '--lw-surface': '#111' },
      );
    });
  });

  describe('content routes + navigation', () => {
    it('registers a content route and removes it on disposeAll', () => {
      const { ctx, registry } = makeContext();

      ctx.registerSurface({
        id: 'doc',
        title: 'doc.title',
        routable: { path: 'doc/:id' },
        component: DummyComponent,
      });
      expect(registry.contentRoutes()).toHaveLength(1);

      ctx.disposeAll();
      expect(registry.contentRoutes()).toHaveLength(0);
    });

    it('delegates navigate / open / close to the content tabs service', () => {
      const { ctx, tabs } = makeContext();

      ctx.navigateContent('dashboard');
      ctx.openContentTab({ path: 'doc/abc', title: 'Doc' });
      ctx.closeContentTab('doc/abc');

      expect(tabs.navigate).toHaveBeenCalledWith('dashboard');
      expect(tabs.open).toHaveBeenCalledWith({ path: 'doc/abc', title: 'Doc' });
      expect(tabs.close).toHaveBeenCalledWith('doc/abc');
    });

    it('requires the "navigation" capability for imperative content navigation', () => {
      const { ctx, tabs } = makeContext(['contributions']);
      expect(() => ctx.navigateContent('x')).toThrow(CapabilityError);
      expect(() => ctx.openContentTab({ path: 'x', title: 'x' })).toThrow(
        CapabilityError,
      );
      expect(() => ctx.closeContentTab('x')).toThrow(CapabilityError);
      expect(() => ctx.revealSurface('x')).toThrow(CapabilityError);
      expect(tabs.navigate).not.toHaveBeenCalled();
    });

    it('carries a rest declaration into the registered route', () => {
      const { ctx, registry } = makeContext();

      ctx.registerSurface({
        id: 'programs',
        title: 'programs.title',
        routable: { path: 'cedents/:id/programs', rest: true },
        component: DummyComponent,
      });

      expect(registry.contentRoutes()[0].rest).toBe(true);
    });

    it('demands "navigation" for a prefix short enough to own the address space', () => {
      const { ctx, registry } = makeContext(['contributions']);

      expect(() =>
        ctx.registerSurface({
          id: 'programs',
          title: 'programs.title',
          routable: { path: 'cedents', rest: true },
          component: DummyComponent,
        }),
      ).toThrow(CapabilityError);
      expect(registry.contentRoutes()).toHaveLength(0);
    });

    it('leaves a narrow prefix and a rest-less short one ungated', () => {
      const { ctx, registry } = makeContext(['contributions']);

      ctx.registerSurface({
        id: 'pricing',
        title: 'pricing.title',
        routable: { path: 'cedents/:id', rest: true },
        component: DummyComponent,
      });
      ctx.registerSurface({
        id: 'search',
        title: 'search.title',
        routable: { path: 'search' },
        component: DummyComponent,
      });

      expect(registry.contentRoutes()).toHaveLength(2);
    });

    it('refuses one following surface whose parameter name means something else', () => {
      const { ctx, registry } = makeContext();
      const error = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      ctx.registerSurface({
        id: 'notes',
        title: 'notes.title',
        routable: {
          path: 'cedents/:cedentId/notes/:id',
          follows: true,
        },
        component: DummyComponent,
      });
      ctx.registerSurface({
        id: 'tasks',
        title: 'tasks.title',
        routable: {
          path: 'cedents/:cedentId/tasks/:id',
          follows: true,
        },
        component: DummyComponent,
      });

      expect(registry.contentRoutes().map((route) => route.id)).toEqual([
        'notes',
      ]);
      expect(error).toHaveBeenCalledWith(expect.stringContaining(':id'));
      error.mockRestore();
    });

    it('leaves surfaces that share a name under the same prefix alone', () => {
      const { ctx, registry } = makeContext();

      for (const facet of ['pricing', 'treaties']) {
        ctx.registerSurface({
          id: facet,
          title: `${facet}.title`,
          routable: {
            path: `cedents/:cedentId/programs/:programId/${facet}`,
            follows: true,
          },
          component: DummyComponent,
        });
      }

      expect(registry.contentRoutes()).toHaveLength(2);
    });

    it('does not police a parameter name that is not following', () => {
      const { ctx, registry } = makeContext();

      ctx.registerSurface({
        id: 'ask',
        title: 'ask.title',
        routable: { path: 'ask/:id' },
        component: DummyComponent,
      });
      ctx.registerSurface({
        id: 'doc',
        title: 'doc.title',
        routable: { path: 'doc/:id' },
        component: DummyComponent,
      });

      expect(registry.contentRoutes()).toHaveLength(2);
    });

    it('exposes the host active-content read through ctx.activeContent', () => {
      const { ctx, tabs } = makeContext();
      expect(ctx.activeContent).toBe(tabs.activeContent);
    });

    it('requires the "navigation" capability for ctx.activeContent', () => {
      const { ctx } = makeContext(['contributions']);
      expect(() => ctx.activeContent).toThrow(CapabilityError);
    });
  });

  describe('renaming a surface', () => {
    it('replaces the title the workbench names it by, and nothing else', () => {
      const { ctx, registry } = makeContext();
      ctx.registerSurface({
        id: 'nav',
        docks: ['primary'],
        title: 'nav.first',
        icon: 'navigator',
        component: DummyComponent,
      });

      ctx.retitleSurface('nav', 'nav.second');

      const view = registry.views()[0];
      expect(view.title).toBe('nav.second');
      expect(view.icon).toBe('navigator');
      expect(registry.views()).toHaveLength(1);
    });

    it('leaves an id nothing was registered under alone', () => {
      const { ctx, registry } = makeContext();
      ctx.registerSurface({
        id: 'nav',
        docks: ['primary'],
        title: 'nav.first',
        component: DummyComponent,
      });

      ctx.retitleSurface('other', 'nav.second');

      expect(registry.views()[0].title).toBe('nav.first');
    });

    it('leaves a surface another plugin registered alone', () => {
      const { ctx, registry } = makeContext();
      registry.addView(
        {
          id: 'theirs',
          region: 'primary',
          title: 't',
          component: DummyComponent,
        },
        'another-plugin',
      );

      ctx.retitleSurface('theirs', 'hijacked');

      expect(registry.views()[0].title).toBe('t');
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host']);

      expect(() => ctx.retitleSurface('nav', 'x')).toThrow(CapabilityError);
    });
  });

  describe('a surface badge', () => {
    const BETA = { text: 'badges.beta', tone: 'brand' } as const;

    function nav(ctx: HostPluginContext, badge?: typeof BETA) {
      return ctx.registerSurface({
        id: 'nav',
        docks: ['primary'],
        title: 'nav.first',
        component: DummyComponent,
        ...(badge && { badge }),
      });
    }

    it('takes the badge a surface declares', () => {
      const { ctx, registry } = makeContext();
      nav(ctx, BETA);

      expect(registry.badgeOf('nav')).toEqual(BETA);
    });

    it('replaces it, takes it away, and leaves an unknown id alone', () => {
      const { ctx, registry } = makeContext();
      nav(ctx);

      ctx.updateSurfaceBadge('nav', BETA);
      expect(registry.badgeOf('nav')).toEqual(BETA);

      ctx.updateSurfaceBadge('other', BETA);
      expect(registry.badgeOf('other')).toBeUndefined();

      ctx.updateSurfaceBadge('nav', null);
      expect(registry.badgeOf('nav')).toBeUndefined();
    });

    it('does not rebuild the surface', () => {
      const { ctx, registry } = makeContext();
      nav(ctx);
      const before = registry.views()[0];

      ctx.updateSurfaceBadge('nav', BETA);

      expect(registry.views()[0]).toBe(before);
    });

    it('goes with the surface when it is disposed, and when it is registered again without one', () => {
      const { ctx, registry } = makeContext();
      const first = nav(ctx, BETA);
      nav(ctx);
      expect(registry.badgeOf('nav')).toBeUndefined();

      ctx.updateSurfaceBadge('nav', BETA);
      first.dispose();
      nav(ctx, BETA).dispose();
      expect(registry.badgeOf('nav')).toBeUndefined();
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host']);

      expect(() => ctx.updateSurfaceBadge('nav', BETA)).toThrow(
        CapabilityError,
      );
    });

    it("leaves another plugin's surface alone", () => {
      const { ctx, registry } = makeContext();
      registry.addView(
        {
          id: 'theirs',
          region: 'primary',
          title: 't',
          component: DummyComponent,
        },
        'another-plugin',
      );

      ctx.updateSurfaceBadge('theirs', BETA);

      expect(registry.badgeOf('theirs')).toBeUndefined();
    });

    it('can be changed from an effect without the effect running again on its own', () => {
      const { ctx, registry } = makeContext();
      nav(ctx);
      const flagged = signal(false);
      let runs = 0;
      TestBed.runInInjectionContext(() =>
        effect(() => {
          runs += 1;
          ctx.updateSurfaceBadge('nav', flagged() ? BETA : null);
        }),
      );
      TestBed.tick();
      flagged.set(true);
      TestBed.tick();

      expect(registry.badgeOf('nav')).toEqual(BETA);
      expect(runs).toBe(2);
    });

    it('goes with a view removed by its id', () => {
      const { ctx, registry } = makeContext();
      nav(ctx, BETA);

      registry.removeViewById('nav');

      expect(registry.badgeOf('nav')).toBeUndefined();
    });
  });

  describe('updating an open tab in place', () => {
    it('hands the change to the tab service under the calling plugin', () => {
      const { ctx, tabs } = makeContext();
      const badge = { text: 'Sent', textIsLiteral: true } as const;

      ctx.updateContentTab('doc/a', { badge });

      expect(tabs.update).toHaveBeenCalledWith(
        'doc/a',
        { badge },
        'test-plugin',
      );
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host', 'navigation']);

      expect(() => ctx.updateContentTab('doc/a', { badge: null })).toThrow(
        CapabilityError,
      );
    });
  });

  describe('leaving a container child out', () => {
    function child(ctx: HostPluginContext, id = 'pane.child') {
      return ctx.registerSurface({
        id,
        docks: [],
        title: 'child.title',
        component: DummyComponent,
      });
    }

    it('leaves out a child the plugin registered, and brings it back', () => {
      const { ctx } = makeContext();
      child(ctx);
      const leftOut = TestBed.inject(LeftOutChildren);

      ctx.setChildShown('pane.child', false);
      expect(leftOut.hides(`${VIEW_PANE_PREFIX}pane.child`)).toBe(true);

      ctx.setChildShown('pane.child', true);
      expect(leftOut.hides(`${VIEW_PANE_PREFIX}pane.child`)).toBe(false);
    });

    it('changes nothing for a surface that is not a container child, and says so in development', () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const { ctx } = makeContext();
      ctx.registerSurface({
        id: 'docked',
        docks: ['primary'],
        title: 'docked.title',
        component: DummyComponent,
      });

      ctx.setChildShown('docked', false);
      ctx.setChildShown('unknown', false);

      expect(
        TestBed.inject(LeftOutChildren).hides(`${VIEW_PANE_PREFIX}docked`),
      ).toBe(false);
      expect(
        TestBed.inject(LeftOutChildren).hides(`${VIEW_PANE_PREFIX}unknown`),
      ).toBe(false);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"docked"'));
      warn.mockRestore();
    });

    it("leaves another plugin's child alone", () => {
      const warn = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const { ctx, registry } = makeContext();
      registry.addView(
        {
          id: 'theirs',
          region: CONTAINER_CHILD_REGION,
          title: 't',
          component: DummyComponent,
        },
        'another-plugin',
      );

      ctx.setChildShown('theirs', false);

      expect(
        TestBed.inject(LeftOutChildren).hides(`${VIEW_PANE_PREFIX}theirs`),
      ).toBe(false);
      warn.mockRestore();
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host']);

      expect(() => ctx.setChildShown('pane.child', false)).toThrow(
        CapabilityError,
      );
    });
  });

  describe("replacing one of a surface's actions", () => {
    const first = { id: 'a', icon: 'add', title: 'act.add' };
    const second = { id: 'b', icon: 'pin', title: 'act.pin', pressed: false };

    function registered(granted?: Capability[]) {
      const made = makeContext(granted);
      made.ctx.registerSurface({
        id: 'nav',
        docks: ['primary'],
        title: 'nav.first',
        icon: 'navigator',
        actions: [first, second],
        component: DummyComponent,
      });
      return made;
    }

    it('replaces the action named, and leaves the rest of the surface alone', () => {
      const { ctx, registry } = registered();
      const flipped = {
        ...second,
        icon: 'unpin',
        title: 'act.unpin',
        pressed: true,
      };

      ctx.updateSurfaceAction('nav', flipped);

      const view = registry.views()[0];
      expect(view.actions).toEqual([first, flipped]);
      expect(view.title).toBe('nav.first');
      expect(view.icon).toBe('navigator');
      expect(registry.views()).toHaveLength(1);
    });

    it('adds an action the surface did not carry', () => {
      const { ctx, registry } = registered();
      const third = { id: 'c', icon: 'sort', title: 'act.sort' };

      ctx.updateSurfaceAction('nav', third);

      expect(registry.views()[0].actions).toEqual([first, second, third]);
    });

    it('leaves a surface id nothing was registered under alone', () => {
      const { ctx, registry } = registered();

      ctx.updateSurfaceAction('other', { ...first, title: 'act.other' });

      expect(registry.views()[0].actions).toEqual([first, second]);
    });

    it('leaves a surface another plugin registered alone', () => {
      const { ctx, registry } = makeContext();
      registry.addView(
        {
          id: 'theirs',
          region: 'primary',
          title: 't',
          actions: [first],
          component: DummyComponent,
        },
        'another-plugin',
      );

      ctx.updateSurfaceAction('theirs', { ...first, run: () => undefined });

      expect(registry.views()[0].actions).toEqual([first]);
    });

    it('needs the "contributions" capability', () => {
      const { ctx } = makeContext(['ui', 'host']);

      expect(() => ctx.updateSurfaceAction('nav', first)).toThrow(
        CapabilityError,
      );
    });
  });

  describe('asking whether the address shown lies under one', () => {
    it('counts the address itself and anything below it', () => {
      const { ctx, shown } = makeContext();
      shown.set({ path: 'sales/quotes/q-0006' });

      expect(ctx.isShowingUnder('sales/quotes')).toBe(true);
      expect(ctx.isShowingUnder('sales')).toBe(true);
      expect(ctx.isShowingUnder('sales/quotes/q-0006')).toBe(true);
    });

    it('does not mistake a longer name for a deeper address', () => {
      const { ctx, shown } = makeContext();
      shown.set({ path: 'sales/quotesomething' });

      expect(ctx.isShowingUnder('sales/quotes')).toBe(false);
    });

    it('answers no while nothing addressable is shown', () => {
      const { ctx } = makeContext();

      expect(ctx.isShowingUnder('sales')).toBe(false);
    });

    it('needs the same capability as reading the active content', () => {
      const { ctx } = makeContext(['contributions']);

      expect(() => ctx.isShowingUnder('sales')).toThrow(CapabilityError);
    });
  });

  describe('default-deny', () => {
    it('rejects contributions without the "contributions" capability', () => {
      const { ctx, registry } = makeContext(['ui', 'host']);
      expect(() =>
        ctx.registerSurface({
          id: 'v',
          docks: ['primary'],
          title: 't',
          component: DummyComponent,
        }),
      ).toThrow(CapabilityError);
      expect(() =>
        ctx.registerCommand({ id: 'c', title: 't', run: () => undefined }),
      ).toThrow(CapabilityError);
      expect(() => ctx.contributeIcons({ pluginGlyph: '<svg/>' })).toThrow(
        CapabilityError,
      );
      expect(registry.views()).toHaveLength(0);
      expect(registry.commands()).toHaveLength(0);
    });

    it('rejects ctx.ui use without the "ui" capability', () => {
      const { ctx, notifications } = makeContext(['contributions', 'host']);
      expect(() => ctx.ui.toast({ message: 'hi' })).toThrow(CapabilityError);
      expect(notifications.notifications()).toHaveLength(0);
    });

    it('rejects ctx.host access without the "host" capability', () => {
      const { ctx } = makeContext(['contributions', 'ui']);
      expect(() => ctx.host).toThrow(CapabilityError);
    });

    it('denies everything when nothing is granted', () => {
      const { ctx } = makeContext([]);
      expect(() =>
        ctx.registerRailItem({
          id: 'r',
          rail: 'activity',
          icon: 'x',
          title: 't',
          run: () => undefined,
        }),
      ).toThrow(CapabilityError);
      expect(() => ctx.ui.alert({ message: 'x' })).toThrow(CapabilityError);
      expect(() => ctx.host).toThrow(CapabilityError);
    });

    it('names the missing capability + plugin id on the error', () => {
      const { ctx } = makeContext([]);
      try {
        ctx.host.version();
        throw new Error('expected a CapabilityError');
      } catch (error) {
        expect(error).toBeInstanceOf(CapabilityError);
        expect((error as CapabilityError).capability).toBe('host');
        expect((error as CapabilityError).pluginId).toBe('test-plugin');
      }
    });
  });
});

describe('a kept surface with sub-routes', () => {
  it('is registered without a warning, since its route follows the sub-address', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { ctx } = makeContext();

    ctx.registerSurface({
      id: 'x.view',
      title: 't',
      component: DummyComponent,
      retain: 'always',
      routable: { path: 'x', subRoutes: ['a', 'b'] },
    });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('region warnings for bar and rail items', () => {
  const BARS: readonly LayoutRegion[] = [
    { id: 'status-bar', type: 'bar', dock: 'bottom' },
    { id: 'primary', type: 'rail', dock: 'left' },
  ];

  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => warn.mockRestore());

  it('says so when a bar item names a region that does not exist', () => {
    const { ctx } = makeContext(ALL, BARS);

    ctx.registerBarItem({
      id: 'x.count',
      bar: 'status',
      slot: 'start',
      component: DummyComponent,
    });

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain("'status'");
    expect(warn.mock.calls[0][0]).toContain('does not declare');
  });

  it('says so when the region exists but is the wrong type', () => {
    const { ctx } = makeContext(ALL, BARS);

    ctx.registerBarItem({
      id: 'x.count',
      bar: 'primary',
      slot: 'start',
      component: DummyComponent,
    });

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain("'rail' region");
  });

  it('stays quiet when the item lands where it can render', () => {
    const { ctx } = makeContext(ALL, BARS);

    ctx.registerBarItem({
      id: 'x.count',
      bar: 'status-bar',
      slot: 'start',
      component: DummyComponent,
    });
    ctx.registerRailItem({
      id: 'x.rail',
      rail: 'primary',
      icon: 'i',
      title: 't',
      run: () => undefined,
    });

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('HostPluginContext command invocation', () => {
  it('stamps the calling plugin as the owner of a command it registers', () => {
    const { ctx, registry } = makeContext();

    ctx.registerCommand({ id: 'mine.go', title: 't', run: () => undefined });

    expect(registry.registeredCommands()[0].ownerId).toBe('test-plugin');
  });

  it('refuses another plugin´s opened command without the automation grant', async () => {
    const { ctx, registry } = makeContext(
      ALL.filter((capability) => capability !== 'automation'),
    );
    const run = vi.fn();
    registry.addCommand(
      { id: 'other.go', title: 't', callable: true, run },
      'other-plugin',
    );

    expect((await ctx.invokeCommand('other.go')).outcome).toBe('refused');
    expect(ctx.invocableCommands()).toHaveLength(0);
    expect(run).not.toHaveBeenCalled();
  });

  it('reaches another plugin´s opened command with the automation grant', async () => {
    const { ctx, registry } = makeContext();
    const run = vi.fn();
    registry.addCommand(
      { id: 'other.go', title: 't', callable: true, run },
      'other-plugin',
    );

    expect((await ctx.invokeCommand('other.go')).outcome).toBe('answered');
    expect(ctx.invocableCommands().map((entry) => entry.id)).toEqual([
      'other.go',
    ]);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('reaches its own command without the automation grant', async () => {
    const { ctx } = makeContext(
      ALL.filter((capability) => capability !== 'automation'),
    );
    const run = vi.fn();
    ctx.registerCommand({ id: 'mine.go', title: 't', run });

    expect((await ctx.invokeCommand('mine.go')).outcome).toBe('answered');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('follows a revocation on the next call, without a reload', async () => {
    const grantedSet = new Set<Capability>(ALL);
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_SOURCE, useValue: signal(ANONYMOUS) }],
    });
    const registry = TestBed.inject(ContributionRegistry);
    const ctx = new HostPluginContext(
      'test-plugin',
      (capability) => grantedSet.has(capability),
      registry,
      TestBed.inject(DialogService),
      TestBed.inject(NotificationService),
      TestBed.inject(SettingsService),
      TestBed.inject(VersionService),
      TestBed.inject(UpdateService),
      {
        navigate: vi.fn(),
        open: vi.fn(),
        close: vi.fn(),
        activeContent: () => null,
      } as unknown as ContentTabsService,
      REGIONS,
      TestBed.inject(IconRegistry),
      TestBed.inject(AuthContext),
      { openList: vi.fn() } as unknown as MenuService,
      TestBed.inject(ThemeRegistry),
      TestBed.inject(SurfaceRevealService),
      TestBed.inject(PluginStateService),
      TestBed.inject(CommandInvocationService),
      TestBed.inject(LeftOutChildren),
    );
    registry.addCommand(
      { id: 'other.go', title: 't', callable: true, run: vi.fn() },
      'other-plugin',
    );

    expect((await ctx.invokeCommand('other.go')).outcome).toBe('answered');

    grantedSet.delete('automation');

    expect((await ctx.invokeCommand('other.go')).outcome).toBe('refused');
    expect(ctx.invocableCommands()).toHaveLength(0);
  });

  it('tells the author when an opened command explains nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { ctx } = makeContext();

    ctx.registerCommand({
      id: 'mine.open',
      title: 't',
      callable: true,
      run: () => undefined,
    });

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('no description');

    warn.mockClear();
    ctx.registerCommand({
      id: 'mine.described',
      title: 't',
      description: 'What it does',
      callable: true,
      run: () => undefined,
    });

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('reads unsaved work for a surface it registered, with nothing granted', () => {
    const { ctx, registry } = makeContext([]);
    registry.addContentRoute(
      { path: 'quotes/:id', component: DummyComponent } as never,
      'test-plugin',
    );

    expect(ctx.hasUnsavedWork('quotes/q-7')).toBe(true);
  });

  it('is told nothing about a surface another plugin registered', () => {
    const { ctx, registry } = makeContext();
    registry.addContentRoute(
      { path: 'invoices/:id', component: DummyComponent } as never,
      'other-plugin',
    );

    expect(ctx.hasUnsavedWork('invoices/i-3')).toBe(false);
  });

  it('is told nothing about an address no plugin registered', () => {
    const { ctx } = makeContext();

    expect(ctx.hasUnsavedWork('nowhere')).toBe(false);
  });
});

describe('a picture of the workbench', () => {
  it('is offered nowhere in a plugin context, at any grant', () => {
    const ctx = makeContext(ALL) as unknown as Record<string, unknown>;

    const reachable = [
      ...Object.keys(ctx),
      ...Object.keys(ctx['ui'] ?? {}),
      ...Object.keys(ctx['host'] ?? {}),
    ];

    expect(
      reachable.filter((name) => /capture|picture|screenshot/i.test(name)),
    ).toEqual([]);
  });
});
