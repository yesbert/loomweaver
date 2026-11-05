import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { PluginRuntime } from './plugin-runtime';
import { PLUGIN } from './plugin';
import { FailedPluginContent } from './failed-plugin-content';
import { Plugin } from './plugin';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { provideCapabilityGrants } from '../permissions/provide-capability-grants';
import { PluginEnablementService } from './enablement/plugin-enablement.service';
import { MenuService } from '../menu/menu.service';
import { CapabilityGrantService } from '../permissions/capability-grant.service';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { provideRequiredPlugins } from '../foundation/required-plugins';

class DummyComponent {}

const menuStub = {
  provide: MenuService,
  useValue: { openList: () => undefined } as unknown as MenuService,
};

const plugin: Plugin = {
  manifest: { id: 'test', name: 'Test' },
  activate(ctx) {
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
  },
};

describe('PluginRuntime', () => {
  afterEach(() => localStorage.clear());

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        menuStub,
        { provide: PLUGIN, useValue: plugin, multi: true },
        provideCapabilityGrants({ test: ['contributions'] }),
      ],
    });
    return {
      runtime: TestBed.inject(PluginRuntime),
      registry: TestBed.inject(ContributionRegistry),
    };
  }

  it('activates plugins, contributing into the registry', () => {
    const { runtime, registry } = setup();

    runtime.activateAll();

    expect(registry.views().map((v) => v.id)).toEqual(['v']);
    expect(registry.barItems().map((index) => index.id)).toEqual(['b']);
  });

  it('isolates a denied plugin (default-deny) without aborting a granted one', () => {
    const denied: Plugin = {
      manifest: { id: 'denied' },
      activate: (ctx) => {
        ctx.registerSurface({
          id: 'dv',
          docks: ['primary'],
          title: 't',
          component: DummyComponent,
        });
      },
    };
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        menuStub,
        { provide: PLUGIN, useValue: plugin, multi: true },
        { provide: PLUGIN, useValue: denied, multi: true },
        provideCapabilityGrants({ test: ['contributions'] }),
      ],
    });
    const runtime = TestBed.inject(PluginRuntime);
    const registry = TestBed.inject(ContributionRegistry);

    expect(() => runtime.activateAll()).not.toThrow();
    expect(registry.views().map((v) => v.id)).toEqual(['v']);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('releases the grant of a plugin that fails to activate', () => {
    const failing: Plugin = {
      manifest: { id: 'failing', capabilities: ['ui'] },
      activate: () => {
        throw new Error('boom');
      },
    };
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        menuStub,
        { provide: PLUGIN, useValue: failing, multi: true },
        provideCapabilityGrants({ failing: ['ui'] }),
      ],
    });

    TestBed.inject(PluginRuntime).activateAll();

    const listed = TestBed.inject(CapabilityGrantService)
      .permissions()
      .map((entry) => entry.pluginId);
    expect(listed).not.toContain('failing');
    error.mockRestore();
  });

  describe('the content of a plugin whose activation failed after it registered it', () => {
    function registersThenFails() {
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const failing: Plugin = {
        manifest: { id: 'orders' },
        activate: (ctx) => {
          ctx.registerSurface({
            id: 'orders.order',
            title: 'Order',
            routable: { path: 'orders/:id' },
            component: DummyComponent,
          });
          throw new Error('boom');
        },
      };
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          menuStub,
          { provide: PLUGIN, useValue: failing, multi: true },
          provideCapabilityGrants({ orders: ['contributions'] }),
        ],
      });
      TestBed.inject(PluginRuntime).activateAll();
      return { error, lost: TestBed.inject(FailedPluginContent) };
    }

    it('is undone, and its addresses are known as those of a plugin that could not be loaded', () => {
      const { error, lost } = registersThenFails();

      expect(TestBed.inject(ContributionRegistry).contentRoutes()).toEqual([]);
      expect(lost.holds('orders/7')).toBe(true);
      expect(lost.holds('invoices/7')).toBe(false);
      error.mockRestore();
    });

    it('is no longer known that way once the user switches the plugin off', () => {
      const { error, lost } = registersThenFails();

      TestBed.inject(PluginEnablementService).setEnabled('orders', false);
      TestBed.tick();

      expect(lost.holds('orders/7')).toBe(false);
      error.mockRestore();
    });
  });

  describe('a plugin whose activation failed', () => {
    function failingBesideAnother() {
      const activate = vi.fn(() => {
        throw new Error('boom');
      });
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          menuStub,
          { provide: PLUGIN, useValue: { manifest: { id: 'failing' }, activate }, multi: true },
          { provide: PLUGIN, useValue: plugin, multi: true },
          provideCapabilityGrants({ test: ['contributions'] }),
        ],
      });
      TestBed.inject(PluginRuntime).activateAll();
      const enablement = TestBed.inject(PluginEnablementService);
      const switchTo = (id: string, enabled: boolean): void => {
        enablement.setEnabled(id, enabled);
        TestBed.tick();
      };
      return { activate, error, switchTo };
    }

    it('is not activated again when another plugin is switched off', () => {
      const { activate, error, switchTo } = failingBesideAnother();
      expect(activate).toHaveBeenCalledTimes(1);

      switchTo('test', false);
      switchTo('test', true);

      expect(activate).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalledTimes(1);
      error.mockRestore();
    });

    it('is tried again once the user switches it off and on', () => {
      const { activate, error, switchTo } = failingBesideAnother();

      switchTo('failing', false);
      switchTo('failing', true);

      expect(activate).toHaveBeenCalledTimes(2);
      error.mockRestore();
    });
  });

  it('does not activate a plugin the user has disabled', () => {
    const { runtime, registry } = setup();
    TestBed.inject(PluginEnablementService).setEnabled('test', false);

    runtime.activateAll();

    expect(registry.views().length).toBe(0);
    expect(registry.barItems().length).toBe(0);
  });

  it('does not activate the same plugin twice', () => {
    const { runtime, registry } = setup();

    runtime.activateAll();
    runtime.activateAll();

    expect(registry.views().length).toBe(1);
    expect(registry.barItems().length).toBe(1);
  });

  it('deactivate undoes the plugin contributions and runs its deactivate hook', () => {
    const deactivate = vi.fn();
    const unloadable: Plugin = {
      manifest: { id: 'unload', name: 'Unload' },
      activate: (ctx) => {
        ctx.registerSurface({
          id: 'uv',
          docks: ['primary'],
          title: 't',
          component: DummyComponent,
        });
      },
      deactivate,
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        menuStub,
        { provide: PLUGIN, useValue: unloadable, multi: true },
        provideCapabilityGrants({ unload: ['contributions'] }),
      ],
    });
    const runtime = TestBed.inject(PluginRuntime);
    const registry = TestBed.inject(ContributionRegistry);

    runtime.activateAll();
    expect(registry.views().some((v) => v.id === 'uv')).toBe(true);

    runtime.deactivate('unload');
    expect(registry.views().some((v) => v.id === 'uv')).toBe(false);
    expect(deactivate).toHaveBeenCalledTimes(1);

    runtime.deactivate('unload');
    runtime.deactivate('nope');
    expect(deactivate).toHaveBeenCalledTimes(1);
  });

  it('lets a late failure of a superseded activation leave the newer activation alone', async () => {
    const first = new Subject<void>();
    let attempts = 0;
    const racing: Plugin = {
      manifest: { id: 'racing', capabilities: ['contributions'] },
      activate(ctx) {
        attempts += 1;
        if (attempts === 1) {
          return firstValueFrom(first);
        }
        ctx.registerCommand({
          id: 'racing.current',
          title: 'Current',
          run: () => undefined,
        });
        return Promise.resolve();
      },
    };
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        menuStub,
        { provide: PLUGIN, useValue: racing, multi: true },
        provideCapabilityGrants({ racing: ['contributions'] }),
      ],
    });
    const runtime = TestBed.inject(PluginRuntime);
    const registry = TestBed.inject(ContributionRegistry);
    const enablement = TestBed.inject(PluginEnablementService);

    runtime.activateAll();
    TestBed.tick();
    enablement.setEnabled('racing', false);
    TestBed.tick();
    enablement.setEnabled('racing', true);
    TestBed.tick();
    expect(attempts).toBe(2);
    expect(registry.commands().some((c) => c.id === 'racing.current')).toBe(
      true,
    );

    first.error(new Error('late'));
    await Promise.resolve();
    await Promise.resolve();

    expect(registry.commands().some((c) => c.id === 'racing.current')).toBe(
      true,
    );
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('superseded');
    error.mockRestore();
  });

  it('unloads a plugin completely even when its teardown throws', () => {
    let activations = 0;
    const broken: Plugin = {
      manifest: { id: 'broken', capabilities: ['contributions'] },
      activate(ctx) {
        activations += 1;
        ctx.registerCommand({
          id: 'broken.cmd',
          title: 'Broken',
          run: () => undefined,
        });
      },
      deactivate() {
        throw new Error('cleanup failed');
      },
    };
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        menuStub,
        { provide: PLUGIN, useValue: broken, multi: true },
        provideCapabilityGrants({ broken: ['contributions'] }),
      ],
    });
    const runtime = TestBed.inject(PluginRuntime);
    const registry = TestBed.inject(ContributionRegistry);
    const grants = TestBed.inject(CapabilityGrantService);
    const enablement = TestBed.inject(PluginEnablementService);
    runtime.activateAll();
    TestBed.tick();

    expect(() => runtime.deactivate('broken')).not.toThrow();

    expect(registry.commands().some((c) => c.id === 'broken.cmd')).toBe(false);
    expect(grants.isGranted('broken', 'contributions')).toBe(false);
    expect(error).toHaveBeenCalledTimes(1);
    enablement.setEnabled('broken', false);
    TestBed.tick();
    enablement.setEnabled('broken', true);
    TestBed.tick();
    expect(activations).toBe(2);
    error.mockRestore();
  });

  it('keeps unloading the other plugins when one teardown throws, and reports afterwards', () => {
    const broken: Plugin = {
      manifest: { id: 'broken', capabilities: ['contributions'] },
      activate(ctx) {
        ctx.registerCommand({
          id: 'broken.cmd',
          title: 'Broken',
          run: () => undefined,
        });
      },
      deactivate() {
        throw new Error('cleanup failed');
      },
    };
    const healthy: Plugin = {
      manifest: { id: 'healthy', capabilities: ['contributions'] },
      activate(ctx) {
        ctx.registerCommand({
          id: 'healthy.cmd',
          title: 'Healthy',
          run: () => undefined,
        });
      },
    };
    const commandsAtReport: number[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        menuStub,
        { provide: PLUGIN, useValue: broken, multi: true },
        { provide: PLUGIN, useValue: healthy, multi: true },
        provideCapabilityGrants({
          broken: ['contributions'],
          healthy: ['contributions'],
        }),
      ],
    });
    const runtime = TestBed.inject(PluginRuntime);
    const registry = TestBed.inject(ContributionRegistry);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {
      commandsAtReport.push(registry.commands().length);
    });
    runtime.activateAll();
    expect(registry.commands()).toHaveLength(2);

    expect(() => runtime.deactivateAll()).not.toThrow();

    expect(registry.commands()).toHaveLength(0);
    expect(commandsAtReport).toEqual([0]);
    error.mockRestore();
  });
});

describe('PluginRuntime with a settings store that answers only asynchronously', () => {
  function slowStore(stored: Record<string, string>) {
    const answered = new Subject<void>();
    const asked = firstValueFrom(answered);
    return {
      answer: () => answered.next(),
      fail: () => answered.error(new Error('401')),
      store: {
        get: (key: string) => asked.then(() => stored[key]),
        set: () => Promise.resolve(),
        delete: () => Promise.resolve(),
      },
    };
  }

  function compose(ids: readonly string[], required: readonly string[]) {
    const { store, answer, fail } = slowStore({
      'lw.shell.disabled-plugins': JSON.stringify(['off', 'core']),
    });
    const activated: string[] = [];
    const deactivated: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        menuStub,
        { provide: SETTINGS_STORE, useValue: store },
        provideRequiredPlugins(...required),
        ...ids.map((id) => ({
          provide: PLUGIN,
          useValue: {
            manifest: { id },
            activate: () => void activated.push(id),
            deactivate: () => void deactivated.push(id),
          } satisfies Plugin,
          multi: true,
        })),
      ],
    });
    TestBed.inject(PluginRuntime).activateAll();
    return { activated, deactivated, answer, fail };
  }

  async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    TestBed.tick();
  }

  it('starts the in-page plugins at once in the order they were composed, and switches one off when the store says so', async () => {
    const { activated, deactivated, answer } = compose(
      ['off', 'on', 'core'],
      ['core'],
    );
    TestBed.tick();

    expect(activated).toEqual(['off', 'on', 'core']);
    expect(deactivated).toEqual([]);

    answer();
    await settle();

    expect(activated).toEqual(['off', 'on', 'core']);
    expect(deactivated).toEqual(['off']);
  });

  it('leaves every in-page plugin running when the read is rejected', async () => {
    const { activated, deactivated, fail } = compose(
      ['off', 'on', 'core'],
      ['core'],
    );

    fail();
    await settle();

    expect(activated).toEqual(['off', 'on', 'core']);
    expect(deactivated).toEqual([]);
  });
});
