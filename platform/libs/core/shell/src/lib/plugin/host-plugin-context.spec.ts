import { SurfaceRevealService } from '../views/surface-reveal.service';
import { PluginStateService } from './plugin-state.service';
import { WritableSignal, signal } from '@angular/core';
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
import { LayoutRegion } from '../layout/layout';
import { IconRegistry } from '../elements/icon/icon-registry';
import { ThemeRegistry } from '../theme/theme-registry';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { CommandInvocationService } from '../commands/command-invocation.service';

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

function makeContext(
  granted: Capability[] = ALL,
  regions: readonly LayoutRegion[] = REGIONS,
  auth: WritableSignal<AuthSnapshot> = signal(ANONYMOUS),
) {
  const menuStub = { openList: vi.fn() } as unknown as MenuService;
  TestBed.configureTestingModule({
    providers: [
      { provide: AUTH_SOURCE, useValue: auth },
      { provide: MenuService, useValue: menuStub },
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
  const tabs = {
    navigate: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    activeContent: () => null,
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
  );
  return {
    ctx,
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
});
