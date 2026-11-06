import { TestBed } from '@angular/core/testing';
import { HostContextFactory } from '../../context/host-context-factory';
import {
  DummyComponent,
  makeContext,
} from '../../context/host-context-harness';
import { KeyValueStore } from '../../../persistence/key-value-store';
import { StateSyncService } from '../../../persistence/cross-tab/state-sync.service';
import { PluginInstallService } from '../../../plugin-store/lifecycle/plugin-install.service';
import { FrameSession } from '../frame-session';
import { frameRpcMethods } from './frame-rpc-methods';
import { FrameAddressPrecedence } from '../frame-address-precedence';
import { PluginIsolationLevelService } from '../../../plugin-isolation/plugin-isolation-level.service';

function framed(pluginId: string) {
  TestBed.inject(PluginIsolationLevelService).register(pluginId, 'isolated');
  const precedence = TestBed.inject(FrameAddressPrecedence);
  return frameRpcMethods({
    pluginId,
    ctx: TestBed.inject(HostContextFactory).create(
      pluginId,
      () => true,
      'isolated',
    ),
    origins: undefined,
    session: {} as FrameSession,
    install: {} as PluginInstallService,
    store: {} as KeyValueStore,
    sync: {} as StateSyncService,
    reportRefusal: () => undefined,
    answered: (surface, registration) =>
      precedence.hold(pluginId, surface, registration),
  });
}

function routed(id: string, path: string) {
  return { id, title: id, routable: { path }, iframe: `/${id}/view.html` };
}

describe('a frame plugin aiming below an address another owner holds', () => {
  function composition() {
    const { ctx: product, registry } = makeContext();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    return { product, registry, warn };
  }

  const owners = (paths: readonly { path: string; pluginId?: string }[]) =>
    paths.map((route) => `${route.pluginId} ${route.path}`);

  afterEach(() => vi.restoreAllMocks());

  it('is refused under the product, naming both addresses and the owner', () => {
    const { product, registry, warn } = composition();
    product.registerSurface({
      id: 'product.orders',
      title: 'Orders',
      routable: { path: 'orders' },
      component: DummyComponent,
    });

    framed('framed').registerSurface(routed('framed.order', 'orders/:id'));

    expect(owners(registry.contentRoutes())).toEqual(['test-plugin orders']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /"orders\/:id".*"orders".*plugin "test-plugin".*plugin "framed"/,
      ),
    );
  });

  it('is refused under another frame plugin, and the first one keeps it', () => {
    const { registry, warn } = composition();
    framed('first').registerSurface(routed('first.docs', 'docs'));

    framed('second').registerSurface(routed('second.special', 'docs/special'));

    expect(owners(registry.contentRoutes())).toEqual(['first docs']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/plugin "first".*plugin "second"/),
    );
  });

  it('is refused below a parameter of an address another owner holds', () => {
    const { product, registry } = composition();
    product.registerSurface({
      id: 'product.order',
      title: 'Order',
      routable: { path: 'orders/:id' },
      component: DummyComponent,
    });

    framed('framed').registerSurface(
      routed('framed.notes', 'orders/o-7/notes'),
    );

    expect(owners(registry.contentRoutes())).toEqual(['test-plugin orders/:id']);
  });

  it('is admitted below its own address, beside another owner, and under the home address', () => {
    const { product, registry, warn } = composition();
    product.registerSurface({
      id: 'product.home',
      title: 'Home',
      routable: { path: '' },
      component: DummyComponent,
    });
    product.registerSurface({
      id: 'product.orders',
      title: 'Orders',
      routable: { path: 'orders' },
      component: DummyComponent,
    });
    const plugin = framed('framed');

    plugin.registerSurface(routed('framed.docs', 'docs'));
    plugin.registerSurface(routed('framed.doc', 'docs/:id'));
    plugin.registerSurface(routed('framed.ordering', 'ordering/new'));

    expect(owners(registry.contentRoutes())).toEqual([
      'test-plugin ',
      'test-plugin orders',
      'framed docs',
      'framed docs/:id',
      'framed ordering/new',
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("leaves the application's own plugins free to register below a frame plugin's address", () => {
    const { product, registry, warn } = composition();
    framed('framed').registerSurface(routed('framed.docs', 'docs'));

    product.registerSurface({
      id: 'product.special',
      title: 'Special',
      routable: { path: 'docs/special' },
      component: DummyComponent,
    });

    expect(owners(registry.contentRoutes())).toEqual([
      'framed docs',
      'test-plugin docs/special',
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("yields to the application's own plugin that registers above it later, with the same warning", () => {
    const { product, registry, warn } = composition();
    framed('framed').registerSurface(routed('framed.order', 'orders/:id'));

    product.registerSurface({
      id: 'product.orders',
      title: 'Orders',
      routable: { path: 'orders' },
      component: DummyComponent,
    });
    TestBed.tick();

    expect(owners(registry.contentRoutes())).toEqual(['test-plugin orders']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(
        /"orders\/:id".*"orders".*plugin "test-plugin".*plugin "framed"/,
      ),
    );
  });

  it('yields to the distribution that registers above it later', () => {
    const { registry } = composition();
    framed('framed').registerSurface(routed('framed.order', 'orders/:id'));

    registry.addContentRoute({ path: 'orders', component: DummyComponent });
    TestBed.tick();

    expect(owners(registry.contentRoutes())).toEqual(['undefined orders']);
  });

  it('keeps its address when another frame plugin registers above it later', () => {
    const { registry, warn } = composition();
    framed('first').registerSurface(routed('first.order', 'orders/:id'));

    framed('second').registerSurface(routed('second.orders', 'orders'));
    TestBed.tick();

    expect(owners(registry.contentRoutes())).toEqual([
      'first orders/:id',
      'second orders',
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns of no withdrawal for an address the plugin no longer holds', () => {
    const { product, registry, warn } = composition();
    framed('framed').registerSurface(routed('framed.order', 'orders/:id'));
    product.registerSurface({
      id: 'product.order',
      title: 'Order',
      routable: { path: 'orders/:id' },
      component: DummyComponent,
    });
    TestBed.tick();

    product.registerSurface({
      id: 'product.orders',
      title: 'Orders',
      routable: { path: 'orders' },
      component: DummyComponent,
    });
    TestBed.tick();

    expect(owners(registry.contentRoutes())).toEqual([
      'test-plugin orders/:id',
      'test-plugin orders',
    ]);
    expect(warn).not.toHaveBeenCalled();
  });
});
