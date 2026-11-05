import { TestBed } from '@angular/core/testing';
import { HostPluginContext } from '../../context/host-plugin-context';
import { HostContextFactory } from '../../context/host-context-factory';
import {
  DummyComponent,
  makeContext,
} from '../../context/host-context-harness';
import { KeyValueStore } from '../../../persistence/key-value-store';
import { StateSyncService } from '../../../persistence/cross-tab/state-sync.service';
import { PluginInstallService } from '../../../plugin-store/lifecycle/plugin-install.service';
import { FrameSession } from '../frame-session';
import { LocalStorageStore } from '../../../persistence/key-value-store';
import { SettingsService } from '../../../settings-dialog/settings.service';
import { FrameRpcDeps, frameRpcMethods } from './frame-rpc-methods';
import { matchRoute } from '../../../regions/content/content-path';

function methodsFor(ctx: Partial<HostPluginContext>, session = {}) {
  return frameRpcMethods({
    pluginId: 'framed',
    ctx: ctx as HostPluginContext,
    origins: undefined,
    session: session as FrameSession,
    install: {} as PluginInstallService,
    store: {} as KeyValueStore,
    sync: {} as StateSyncService,
    reportRefusal: () => undefined,
  });
}

describe('frameRpcMethods — leaving a container child out across the seam', () => {
  it('brings a child back only on a real true', () => {
    const setChildShown = vi.fn();
    const methods = methodsFor({ setChildShown });

    methods.setChildShown('pane.child', 'yes' as unknown as boolean);
    methods.setChildShown('pane.child', true);

    expect(setChildShown.mock.calls).toEqual([
      ['pane.child', false],
      ['pane.child', true],
    ]);
  });
});

describe('frameRpcMethods — a text argument across the seam', () => {
  const NOT_TEXT = 7 as unknown as string;

  it('refuses one that is not a string, naming the call and the argument, before the host sees it', () => {
    const ctx = {
      navigateContent: vi.fn(),
      setChildShown: vi.fn(),
      retitleSurface: vi.fn(),
      invokeCommand: vi.fn(),
    };
    const methods = methodsFor(ctx);

    expect(() => methods.navigateContent(NOT_TEXT)).toThrow(
      "navigateContent takes 'path' as a string",
    );
    expect(() => methods.setChildShown(NOT_TEXT, true)).toThrow(TypeError);
    expect(() => methods.retitleSurface('nav', NOT_TEXT)).toThrow(
      "retitleSurface takes 'title' as a string",
    );
    expect(() => methods.invokeCommand(NOT_TEXT)).toThrow(TypeError);
    for (const call of Object.values(ctx)) {
      expect(call).not.toHaveBeenCalled();
    }
  });

  it('refuses a state key that is not a string the same way', () => {
    const session = { watch: vi.fn(), set: vi.fn() };
    const methods = methodsFor({}, session);

    expect(() => methods.stateWatch(NOT_TEXT)).toThrow(TypeError);
    expect(() => methods.stateSet(NOT_TEXT, 1)).toThrow(TypeError);
    expect(session.watch).not.toHaveBeenCalled();
    expect(session.set).not.toHaveBeenCalled();
  });

  it('passes a string through as it is, the empty one included', () => {
    const navigateContent = vi.fn();
    const methods = methodsFor({ navigateContent });

    methods.navigateContent('');
    methods.navigateContent('quotes/q-7');

    expect(navigateContent.mock.calls).toEqual([[''], ['quotes/q-7']]);
  });
});

describe('frameRpcMethods — replacing what another owner contributed', () => {
  function composition() {
    const { ctx: product, registry } = makeContext();
    const framed = TestBed.inject(HostContextFactory).create(
      'framed',
      () => true,
      'isolated',
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    return { product, registry, methods: methodsFor(framed), warn };
  }

  afterEach(() => vi.restoreAllMocks());

  it('a frame plugin aiming at the address the product answers is refused, and both are named', () => {
    const { product, registry, methods, warn } = composition();
    product.registerSurface({
      id: 'product.home',
      title: 'Home',
      routable: { path: 'home' },
      component: DummyComponent,
    });

    methods.registerSurface({
      id: 'framed.home',
      title: 'Mine',
      routable: { path: '/home' },
      iframe: '/framed/home.html',
    });

    expect(registry.contentRoutes().map((route) => route.pluginId)).toEqual([
      'test-plugin',
    ]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/plugin "test-plugin".*plugin "framed"/),
    );
  });

  it('the product registering after a frame plugin took a form of its address is the one shown', () => {
    const { product, registry, methods } = composition();
    methods.registerSurface({
      id: 'framed.orders',
      title: 'Mine',
      routable: { path: '/orders/' },
      iframe: '/framed/orders.html',
    });

    product.registerSurface({
      id: 'product.orders',
      title: 'Orders',
      routable: { path: 'orders' },
      component: DummyComponent,
    });

    expect(registry.contentRoutes().map((route) => route.path)).toEqual([
      'orders',
    ]);
    expect(matchRoute(registry.contentRoutes(), 'orders')?.pluginId).toBe(
      'test-plugin',
    );
  });

  it('a frame plugin is refused an address that differs from a held one only in a parameter name', () => {
    const { product, registry, methods, warn } = composition();
    product.registerSurface({
      id: 'product.order',
      title: 'Order',
      routable: { path: 'orders/:id' },
      component: DummyComponent,
    });

    methods.registerSurface({
      id: 'framed.order',
      title: 'Mine',
      routable: { path: '/orders/:orderId/' },
      iframe: '/framed/order.html',
    });

    expect(registry.contentRoutes().map((route) => route.pluginId)).toEqual([
      'test-plugin',
    ]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/plugin "test-plugin".*plugin "framed"/),
    );
  });

  it('a frame plugin cannot take the id of a view another owner holds', () => {
    const { product, registry, methods, warn } = composition();
    product.registerSurface({
      id: 'navigator',
      title: 'Navigator',
      docks: ['primary'],
      component: DummyComponent,
    });

    methods.registerSurface({
      id: 'navigator',
      title: 'Mine',
      docks: ['primary'],
      iframe: '/framed/nav.html',
    });
    methods.registerSurface({
      id: 'navigator',
      title: 'Mine',
      routable: { path: 'framed/nav' },
      iframe: '/framed/nav.html',
    });

    expect(registry.views().map((view) => view.pluginId)).toEqual([
      'test-plugin',
    ]);
    expect(registry.contentRoutes()).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('a frame plugin cannot replace a menu entry another owner holds, the workbench included', () => {
    const { product, registry, methods, warn } = composition();
    product.registerMenuItem({ id: 'product.open', menu: 'file', title: 'Open' });
    registry.addMenuItem({ id: 'shell.about', menu: 'help', title: 'About' });

    methods.registerMenuItem({ id: 'product.open', menu: 'file', title: 'Mine' });
    methods.registerMenuItem({ id: 'shell.about', menu: 'help', title: 'Mine' });

    expect(registry.menuItems().map((item) => item.title)).toEqual([
      'Open',
      'About',
    ]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/plugin "test-plugin".*plugin "framed"/),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/the workbench.*plugin "framed"/),
    );
  });

  function framedSections(
    pluginId: string,
    stopSync: () => void = () => undefined,
    granted = true,
    wired: Partial<FrameRpcDeps> = {},
  ) {
    const ctx = TestBed.inject(HostContextFactory).create(
      pluginId,
      () => granted,
      'isolated',
    );
    return frameRpcMethods({
      pluginId,
      ctx,
      origins: undefined,
      session: {
        notify: () => undefined,
        addCleanup: () => undefined,
      } as unknown as FrameSession,
      install: { isInstalled: () => true } as unknown as PluginInstallService,
      store: new LocalStorageStore(),
      sync: { register: () => stopSync } as unknown as StateSyncService,
      reportRefusal: () => undefined,
      ...wired,
    });
  }

  function sectionTitled(title: string, id: string) {
    return {
      id,
      title,
      rows: [
        {
          id: 'loud',
          label: 'Loud',
          control: { kind: 'toggle' as const, value: false },
        },
      ],
    };
  }

  it('a frame settings section cannot take the place of one another plugin holds, dotted ids included', () => {
    const { warn } = composition();
    const settings = TestBed.inject(SettingsService);

    framedSections('acme').registerSettingsSection(
      sectionTitled('First', 'tools.general'),
    );
    framedSections('acme.tools').registerSettingsSection(
      sectionTitled('Second', 'general'),
    );

    expect(
      settings
        .all()
        .filter((section) => section.id === 'acme.tools.general')
        .map((section) => section.title),
    ).toEqual(['First']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/plugin "acme".*plugin "acme\.tools"/),
    );
    localStorage.clear();
  });

  it('a settings section refused for its holder stops following the other windows at once', () => {
    composition();
    const stopSync = vi.fn();
    framedSections('acme').registerSettingsSection(
      sectionTitled('First', 'tools.general'),
    );

    framedSections('acme.tools', stopSync).registerSettingsSection(
      sectionTitled('Second', 'general'),
    );

    expect(stopSync).toHaveBeenCalledTimes(1);
    localStorage.clear();
  });

  it('a settings section refused for want of a capability stops following the other windows at once', () => {
    composition();
    const stopSync = vi.fn();
    const ungranted = framedSections('acme', stopSync, false);

    expect(() =>
      ungranted.registerSettingsSection(sectionTitled('First', 'prefs')),
    ).toThrow();

    expect(stopSync).toHaveBeenCalledTimes(1);
    localStorage.clear();
  });

  it('a settings section that is registered keeps following the other windows', () => {
    composition();
    const stopSync = vi.fn();

    framedSections('acme', stopSync).registerSettingsSection(
      sectionTitled('First', 'prefs'),
    );

    expect(stopSync).not.toHaveBeenCalled();
    localStorage.clear();
  });

  it('a frame that registers its settings section again hears a change from another window once', async () => {
    composition();
    const told = vi.fn();
    const sync = TestBed.inject(StateSyncService);
    const methods = framedSections('acme', undefined, true, {
      sync,
      session: { notify: told, addCleanup: () => undefined } as unknown as FrameSession,
    });
    methods.registerSettingsSection(sectionTitled('First', 'prefs'));
    methods.registerSettingsSection(sectionTitled('Second', 'prefs'));
    told.mockClear();

    sync.notifyRemoteChange('lw.plugin-settings:acme:prefs');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(told).toHaveBeenCalledTimes(1);
    localStorage.clear();
  });

  it('a frame plugin registers its own settings section again', () => {
    const { warn } = composition();
    const methods = framedSections('acme');

    methods.registerSettingsSection(sectionTitled('First', 'prefs'));
    methods.registerSettingsSection(sectionTitled('Second', 'prefs'));

    expect(
      TestBed.inject(SettingsService)
        .all()
        .filter((section) => section.id === 'acme.prefs')
        .map((section) => section.title),
    ).toEqual(['Second']);
    expect(warn).not.toHaveBeenCalled();
    localStorage.clear();
  });

  it('a frame plugin replaces what it registered itself', () => {
    const { registry, methods, warn } = composition();

    methods.registerSurface({
      id: 'framed.view',
      title: 'First',
      docks: ['primary'],
      iframe: '/framed/view.html',
    });
    methods.registerSurface({
      id: 'framed.view',
      title: 'Second',
      docks: ['primary'],
      iframe: '/framed/view.html',
    });
    methods.registerMenuItem({ id: 'framed.open', menu: 'file', title: 'First' });
    methods.registerMenuItem({ id: 'framed.open', menu: 'file', title: 'Second' });

    expect(registry.views().map((view) => view.title)).toEqual(['Second']);
    expect(registry.menuItems().map((item) => item.title)).toEqual(['Second']);
    expect(warn).not.toHaveBeenCalled();
  });

  it("a plugin composed as the application's own code still replaces by id", () => {
    const { product, registry, warn } = composition();
    registry.addMenuItem({ id: 'shell.about', menu: 'help', title: 'About' });
    registry.addContentRoute({
      id: 'shell.home',
      path: 'home',
      title: 'Home',
      component: DummyComponent,
    });

    product.registerMenuItem({ id: 'shell.about', menu: 'help', title: 'Ours' });
    product.registerSurface({
      id: 'product.home',
      title: 'Ours',
      routable: { path: 'home' },
      component: DummyComponent,
    });

    expect(registry.menuItems().map((item) => item.title)).toEqual(['Ours']);
    expect(registry.contentRoutes().map((route) => route.pluginId)).toEqual([
      'test-plugin',
    ]);
    expect(warn).not.toHaveBeenCalled();
  });
});
