import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { PLUGIN, PluginRuntime } from './plugin-runtime';
import { Plugin } from './plugin';
import { ContributionRegistry } from './contribution-registry';
import { provideCapabilityGrants } from '../permissions/capability-grants';
import { PluginEnablementService } from '../plugin-store/lifecycle/plugin-enablement.service';
import { MenuService } from '../menu/menu.service';
import { CapabilityGrantService } from '../permissions/capability-grant.service';

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
        ctx.registerCommand({ id: 'racing.current', title: 'Current', run: () => undefined });
        return Promise.resolve();
      },
    };
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
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
    expect(registry.commands().some((c) => c.id === 'racing.current')).toBe(true);

    first.error(new Error('late'));
    await Promise.resolve();
    await Promise.resolve();

    expect(registry.commands().some((c) => c.id === 'racing.current')).toBe(true);
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
        ctx.registerCommand({ id: 'broken.cmd', title: 'Broken', run: () => undefined });
      },
      deactivate() {
        throw new Error('cleanup failed');
      },
    };
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
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
        ctx.registerCommand({ id: 'broken.cmd', title: 'Broken', run: () => undefined });
      },
      deactivate() {
        throw new Error('cleanup failed');
      },
    };
    const healthy: Plugin = {
      manifest: { id: 'healthy', capabilities: ['contributions'] },
      activate(ctx) {
        ctx.registerCommand({ id: 'healthy.cmd', title: 'Healthy', run: () => undefined });
      },
    };
    const commandsAtReport: number[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        menuStub,
        { provide: PLUGIN, useValue: broken, multi: true },
        { provide: PLUGIN, useValue: healthy, multi: true },
        provideCapabilityGrants({ broken: ['contributions'], healthy: ['contributions'] }),
      ],
    });
    const runtime = TestBed.inject(PluginRuntime);
    const registry = TestBed.inject(ContributionRegistry);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {
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
