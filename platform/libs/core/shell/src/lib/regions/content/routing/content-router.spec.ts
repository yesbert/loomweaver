import {
  ApplicationRef,
  Component,
  WritableSignal,
  signal,
} from '@angular/core';
import { Location } from '@angular/common';
import { Router, Routes } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { buildContentRoutes, ContentRouter } from './content-router';
import { SurfaceRouteStub } from './surface-route-stub';
import { ContentSubStub } from './content-sub-stub';
import { AuthRequiredView } from '../access/auth-required-view';
import { RouteUnavailableView } from '../access/route-unavailable-view';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { AUTH_SOURCE } from '../../../auth/auth-context';
import { ContentReuseStrategy } from './content-reuse-strategy';
import type { Mock } from 'vitest';

@Component({ selector: 'lw-test-route', template: '' })
class TestRoute {}

describe('buildContentRoutes', () => {
  it('hands a deferred surface to the router as loadComponent (finding #24)', () => {
    const loadComponent = () => Promise.resolve(TestRoute);

    const [route] = buildContentRoutes([{ path: 'graph', loadComponent }]);

    expect(route.loadComponent).toBe(loadComponent);
    expect(route.component).toBeUndefined();
  });

  it('maps a component route straight through, carrying chromeless in data', () => {
    const [route] = buildContentRoutes([
      {
        path: 'reports',
        component: TestRoute,
        chromeless: true,
      },
    ]);

    expect(route.path).toBe('reports');
    expect(route.component).toBe(TestRoute);
    expect(route.data).toMatchObject({
      content: true,
      chromeless: true,
    });
    expect(route.data?.['iframe']).toBeUndefined();
  });

  it('stamps the effective retention into route data', () => {
    const [plain] = buildContentRoutes([
      { path: 'plain', component: TestRoute },
    ]);
    const [declared] = buildContentRoutes([
      { path: 'editor', component: TestRoute, retain: 'always' },
    ]);
    const [frame] = buildContentRoutes(
      [{ path: 'frame', iframe: '/f.html', retain: 'always' }],
      [],
      'destroy',
    );
    const [container] = buildContentRoutes(
      [
        {
          path: 'ws/:id',
          container: { children: ['a'] },
          retain: 'always',
        } as never,
      ],
      [],
      'retain',
    );
    const [flipped] = buildContentRoutes(
      [{ path: 'plain', component: TestRoute }],
      [],
      'retain',
    );
    const [optedOut] = buildContentRoutes(
      [{ path: 'scratch', component: TestRoute, retain: 'never' }],
      [],
      'retain',
    );

    expect(plain.data?.['retain']).toBe(false);
    expect(declared.data?.['retain']).toBe(true);
    expect(frame.data?.['retain']).toBe(true);
    expect(container.data?.['retain']).toBe(false);
    expect(flipped.data?.['retain']).toBe(true);
    expect(optedOut.data?.['retain']).toBe(false);
  });

  it('maps an iframe route to the stub that owns its URL, carrying the URL in data', () => {
    const [route] = buildContentRoutes([
      { path: 'sandbox-rpc', iframe: '/plugin/view.html' },
    ]);

    expect(route.component).toBe(SurfaceRouteStub);
    expect(route.data).toMatchObject({
      content: true,
      iframe: '/plugin/view.html',
    });
  });

  it('maps a retained component route to the stub — the stash owns the instance, keyed by pane (TreeWeaver #42)', () => {
    const [retained, plain] = buildContentRoutes([
      { path: 'notes', component: TestRoute, retain: 'always' },
      { path: 'search', component: TestRoute },
    ]);

    expect(retained.component).toBe(SurfaceRouteStub);
    expect(retained.loadComponent).toBeUndefined();
    expect(retained.data).toMatchObject({ retain: true });
    expect(plain.component).toBe(TestRoute);
  });

  it('the retention default flips every undeclared route onto the stub as well', () => {
    const [route] = buildContentRoutes(
      [{ path: 'search', component: TestRoute }],
      [],
      'retain',
    );

    expect(route.component).toBe(SurfaceRouteStub);
    expect(route.data).toMatchObject({ retain: true });
  });

  it('generates child routes for subRoutes: an empty-rest stub + one per sub', () => {
    const [route] = buildContentRoutes([
      {
        path: 'doc/:id',
        component: TestRoute,
        subRoutes: ['code', 'preview'],
      },
    ]);

    expect(route.path).toBe('doc/:id');
    expect(route.children).toEqual([
      {
        path: '',
        pathMatch: 'full',
        component: expect.any(Function),
        data: { content: true, sub: true },
      },
      {
        path: 'code',
        component: expect.any(Function),
        data: { content: true, sub: true },
      },
      {
        path: 'preview',
        component: expect.any(Function),
        data: { content: true, sub: true },
      },
    ]);
    expect(route.children?.[1].component).toBe(ContentSubStub);
    expect(route.children?.some((child) => child.redirectTo)).toBe(false);
  });

  it('keeps a sub-route that carries a value', () => {
    const [route] = buildContentRoutes([
      {
        path: 'programs/:programId',
        component: TestRoute,
        subRoutes: ['structure/:structureId', 'flows/:flowId'],
      },
    ]);

    expect(route.children?.map((child) => child.path)).toEqual([
      '',
      'structure/:structureId',
      'flows/:flowId',
    ]);
  });

  it('gives a rest-owning route a wildcard child so a deeper address matches', () => {
    const [route] = buildContentRoutes([
      { path: 'programs', component: TestRoute, rest: true },
    ]);

    expect(route.children).toEqual([
      {
        path: '**',
        component: ContentSubStub,
        data: { content: true, sub: true },
      },
    ]);
  });

  it('puts the wildcard last so declared subRoutes still win', () => {
    const [route] = buildContentRoutes([
      {
        path: 'programs',
        component: TestRoute,
        subRoutes: ['pricing'],
        rest: true,
      },
    ]);

    expect(route.children?.map((child) => child.path)).toEqual([
      '',
      'pricing',
      '**',
    ]);
  });

  it('leaves a route without subRoutes childless', () => {
    const [route] = buildContentRoutes([
      { path: 'search', component: TestRoute },
    ]);
    expect(route.children).toBeUndefined();
  });

  it('gates a route with a canMatch guard + a placeholder twin at the same path', () => {
    const routes = buildContentRoutes([
      { path: 'secret', component: TestRoute, access: { anyRole: ['admin'] } },
    ]);

    expect(routes).toHaveLength(2);
    const [real, placeholder] = routes;
    expect(real.path).toBe('secret');
    expect(real.component).toBe(TestRoute);
    expect(real.canMatch).toHaveLength(1);
    expect(placeholder.path).toBe('secret');
    expect(placeholder.component).toBe(AuthRequiredView);
    expect(placeholder.data).toMatchObject({
      content: true,
      authPlaceholder: true,
    });
    expect(placeholder.canMatch).toBeUndefined();
  });

  it('leaves an ungated route as a single entry without a guard', () => {
    const routes = buildContentRoutes([
      { path: 'search', component: TestRoute },
    ]);
    expect(routes).toHaveLength(1);
    expect(routes[0].canMatch).toBeUndefined();
  });

  it('gives an omitted route a placeholder at its path instead of a real entry', () => {
    const routes = buildContentRoutes(
      [],
      [{ id: 'testbed.notes', path: 'notes', component: TestRoute }],
    );

    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe('notes');
    expect(routes[0].component).toBe(RouteUnavailableView);
    expect(routes[0].data).toMatchObject({
      content: true,
      routePlaceholder: true,
    });
  });

  it('keeps omitted placeholders behind the registered routes', () => {
    const routes = buildContentRoutes(
      [{ path: 'search', component: TestRoute }],
      [{ id: 'testbed.notes', path: 'notes', component: TestRoute }],
    );

    expect(routes.map((route) => route.component)).toEqual([
      TestRoute,
      RouteUnavailableView,
    ]);
  });
});

function contentRoutesOf(
  routes: { path?: string }[],
): { path?: string; data?: unknown }[] {
  return routes.filter((route) => !route.path?.startsWith('popout'));
}

describe('ContentRouter', () => {
  let router: {
    resetConfig: Mock;
    initialNavigation: Mock;
    navigateByUrl: Mock;
    url: string;
  };
  let prune: Mock;
  let registry: ContributionRegistry;
  let popState: () => void;

  function setup(path: string) {
    router = {
      resetConfig: vi.fn(),
      initialNavigation: vi.fn(),
      navigateByUrl: vi.fn().mockResolvedValue(true),
      url: '/',
    };
    prune = vi.fn();
    popState = () => undefined;
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: Location,
          useValue: {
            path: () => path,
            subscribe: (callback: () => void) => {
              popState = callback;
              return { unsubscribe: () => undefined };
            },
          },
        },
        { provide: ContentReuseStrategy, useValue: { pruneExcept: prune } },
      ],
    });
    registry = TestBed.inject(ContributionRegistry);
    return TestBed.inject(ContentRouter);
  }

  function tick() {
    TestBed.inject(ApplicationRef).tick();
  }

  it('carries the owning plugin into the route data so the surface can check its grants', () => {
    const content = setup('/');
    registry.addContentRoute(
      { path: 'sandbox', iframe: '/p/view.html' } as never,
      'sandbox-rpc',
    );

    content.start();

    expect(
      contentRoutesOf(router.resetConfig.mock.calls[0][0])[0].data,
    ).toMatchObject({
      pluginId: 'sandbox-rpc',
    });
  });

  it('sets the config from the registered routes and starts the initial navigation', () => {
    const content = setup('/');
    registry.addContentRoute({ path: 'search', component: TestRoute });

    content.start();

    expect(router.resetConfig).toHaveBeenCalledTimes(1);
    expect(
      contentRoutesOf(router.resetConfig.mock.calls[0][0])[0],
    ).toMatchObject({
      path: 'search',
    });
    expect(router.initialNavigation).toHaveBeenCalledTimes(1);
  });

  it('is idempotent: a second start does nothing', () => {
    const content = setup('/');
    content.start();
    content.start();
    expect(router.initialNavigation).toHaveBeenCalledTimes(1);
  });

  it('rebuilds the config and prunes stale reuse handles when routes change', async () => {
    const content = setup('/');
    content.start();
    router.resetConfig.mockClear();

    registry.addContentRoute({ path: 'reports', component: TestRoute });
    tick();

    expect(router.resetConfig).toHaveBeenCalledTimes(1);
    expect(prune).toHaveBeenCalledTimes(1);
  });

  it('resolves a captured deep-link once its route is registered', async () => {
    const content = setup('/doc/7');
    content.start();
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();
    await Promise.resolve();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/doc/7', {
      onSameUrlNavigation: 'reload',
    });
  });

  it('does not chase a deep-link once the user has navigated away (popstate)', () => {
    const content = setup('/doc/7');
    content.start();
    popState();
    router.url = '/reports';

    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('recovers a deep-link after the router drifts programmatically during boot (LWF-02a)', async () => {
    const content = setup('/doc/7');
    content.start();
    router.url = '/reports';

    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();
    await Promise.resolve();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/doc/7', {
      onSameUrlNavigation: 'reload',
    });
  });

  it('gives a pending deep-link something to land on, so the initial navigation matches', () => {
    const content = setup('/doc/7');
    registry.addContentRoute({ path: 'search', component: TestRoute });

    content.start();

    const config = router.resetConfig.mock.calls[0][0] as Routes;
    const placeholder = config.find((route) => route.path === 'doc/7');
    expect(placeholder).toBeDefined();
    expect(placeholder?.component).toBe(RouteUnavailableView);
  });

  it('still lands the deep-link where a home route would swallow it as a prefix', () => {
    const content = setup('/doc/7');
    registry.addContentRoute({ path: '', component: TestRoute });

    content.start();

    const config = router.resetConfig.mock.calls[0][0] as Routes;
    expect(config.some((route) => route.path === 'doc/7')).toBe(true);
  });

  it('leaves an address a real route already answers to that route', () => {
    const content = setup('/doc/7');
    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });

    content.start();

    const config = router.resetConfig.mock.calls[0][0] as Routes;
    expect(config.some((route) => route.path === 'doc/7')).toBe(false);
  });

  it('drops the placeholder once the route that answers the address registers', async () => {
    const content = setup('/doc/7');
    content.start();

    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();
    await Promise.resolve();

    const config = router.resetConfig.mock.calls.at(-1)?.[0] as Routes;
    expect(config.some((route) => route.path === 'doc/7')).toBe(false);
    expect(config.some((route) => route.path === 'doc/:id')).toBe(true);
  });

  it('captures no deep-link for the home URL', () => {
    const content = setup('/');
    content.start();
    registry.addContentRoute({ path: 'doc/:id', component: TestRoute });
    tick();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});

describe('ContentRouter auth re-match', () => {
  function setup(url: string, auth: WritableSignal<AuthSnapshot>) {
    const router = {
      resetConfig: vi.fn(),
      initialNavigation: vi.fn(),
      navigateByUrl: vi.fn().mockResolvedValue(true),
      url,
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        {
          provide: Location,
          useValue: {
            path: () => url,
            subscribe: () => ({ unsubscribe: () => undefined }),
          },
        },
        { provide: ContentReuseStrategy, useValue: { pruneExcept: vi.fn() } },
        { provide: AUTH_SOURCE, useValue: auth },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    return { router, registry, content: () => TestBed.inject(ContentRouter) };
  }

  function tick() {
    TestBed.inject(ApplicationRef).tick();
  }

  it('re-navigates (reload) on an auth change when the current route is gated', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const { router, registry, content } = setup('/secret', auth);
    registry.addContentRoute({
      path: 'secret',
      component: TestRoute,
      access: { anyRole: ['admin'] },
    });
    content().start();
    tick();
    router.navigateByUrl.mockClear();

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    tick();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/secret', {
      onSameUrlNavigation: 'reload',
    });
  });

  it('does not re-navigate on an auth change when the current route is ungated', () => {
    const auth = signal<AuthSnapshot>(ANONYMOUS);
    const { router, registry, content } = setup('/search', auth);
    registry.addContentRoute({ path: 'search', component: TestRoute });
    content().start();
    tick();
    router.navigateByUrl.mockClear();

    auth.set({ authenticated: true, roles: ['admin'], claims: {} });
    tick();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
