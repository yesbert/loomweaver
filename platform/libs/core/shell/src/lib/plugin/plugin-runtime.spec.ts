import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLUGIN, PluginRuntime } from './plugin-runtime';
import { Plugin } from './plugin';
import { ContributionRegistry } from './contribution-registry';
import { provideCapabilityGrants } from '../permissions/capability-grants';
import { PluginEnablementService } from '../plugin-store/lifecycle/plugin-enablement.service';
import { MenuService } from '../menu/menu.service';

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
});
