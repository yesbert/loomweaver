import { Component } from '@angular/core';
import {
  Route,
  UrlMatchResult,
  UrlSegment,
  UrlSegmentGroup,
} from '@angular/router';
import {
  addressPlaceholder,
  buildContentRoutes,
  routePlaceholder,
} from './content-route-table';
import { SurfaceRouteStub } from './surface-route-stub';
import { ContentSubStub } from './content-sub-stub';

@Component({ selector: 'lw-test-route', template: '' })
class TestRoute {}

describe('buildContentRoutes', () => {
  it('leaves a deferred surface to the pane, handing the router only the stub', () => {
    const loadComponent = () => Promise.resolve(TestRoute);

    const [route] = buildContentRoutes([{ path: 'graph', loadComponent }]);

    expect(route.loadComponent).toBeUndefined();
    expect(route.component).toBe(SurfaceRouteStub);
  });

  it('maps a component route to the stub, marked as content', () => {
    const [route] = buildContentRoutes([
      {
        path: 'reports',
        component: TestRoute,
        chromeless: true,
      },
    ]);

    expect(route.path).toBe('reports');
    expect(route.component).toBe(SurfaceRouteStub);
    expect(route.data).toEqual({ content: true });
  });

  describe('for an address the address form encodes', () => {
    const matched = (route: Route, url: string): UrlMatchResult | null =>
      route.matcher?.(
        url.split('/').map((part) => new UrlSegment(decodeURIComponent(part), {})),
        new UrlSegmentGroup([], {}),
        route,
      ) ?? null;

    it('answers that address however the registry holds it, and hands over its values', () => {
      const [open, gated, heldBack, omitted] = buildContentRoutes(
        [
          { path: '%C3%BCbersicht/:id', component: TestRoute },
          {
            path: 'b%C3%BCro',
            component: TestRoute,
            access: { authenticated: true },
          },
        ],
        [{ path: 'sp%C3%A4ter', component: TestRoute }],
      );

      const overview = matched(open, '%C3%BCbersicht/7/more');
      expect(overview?.consumed.map((segment) => segment.path)).toEqual([
        'übersicht',
        '7',
      ]);
      expect(overview?.posParams?.['id'].path).toBe('7');
      expect(matched(open, 'overview/7')).toBeNull();
      expect(matched(gated, 'b%C3%BCro')).not.toBeNull();
      expect(matched(heldBack, 'b%C3%BCro')).not.toBeNull();
      expect(matched(omitted, 'sp%C3%A4ter')).not.toBeNull();
    });

    it('keeps an encoded slash inside its segment', () => {
      const [declared] = buildContentRoutes([
        { path: 'doc/a%2Fb', component: TestRoute },
      ]);
      const placeholder = addressPlaceholder('doc/a%2Fb');

      for (const route of [declared, placeholder]) {
        expect(matched(route, 'doc/a%2Fb')).not.toBeNull();
        expect(matched(route, 'doc/a/b')).toBeNull();
      }
    });

    it('takes a colon or asterisks in an address that was opened as the characters they are, not as a value or a wildcard', () => {
      for (const address of ['doc/%3Ax', 'doc/:x']) {
        const placeholder = addressPlaceholder(address);

        expect(matched(placeholder, 'doc/:x')).not.toBeNull();
        expect(matched(placeholder, 'doc/other')).toBeNull();
      }
      expect(matched(addressPlaceholder('%2A%2A'), '**')).not.toBeNull();
      expect(matched(addressPlaceholder('%2A%2A'), 'anything')).toBeNull();
    });

    it('still hands a plain address or pattern to the router as a path', () => {
      expect(routePlaceholder('doc/:id').path).toBe('doc/:id');
      expect(routePlaceholder('doc/:id').matcher).toBeUndefined();
      expect(addressPlaceholder('doc/7').path).toBe('doc/7');
      expect(addressPlaceholder('doc/7').matcher).toBeUndefined();
    });
  });

  it('maps an iframe route to the stub, marked as content', () => {
    const [route] = buildContentRoutes([
      { path: 'sandbox-rpc', iframe: '/plugin/view.html' },
    ]);

    expect(route.component).toBe(SurfaceRouteStub);
    expect(route.data).toEqual({ content: true });
  });

  it('maps a retained component route to the stub — the stash owns the instance, keyed by pane', () => {
    const [retained, plain] = buildContentRoutes([
      { path: 'notes', component: TestRoute, retain: 'always' },
      { path: 'search', component: TestRoute },
    ]);

    expect(retained.component).toBe(SurfaceRouteStub);
    expect(retained.loadComponent).toBeUndefined();
    expect(plain.component).toBe(SurfaceRouteStub);
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
        data: { content: true },
      },
      {
        path: 'code',
        component: expect.any(Function),
        data: { content: true },
      },
      {
        path: 'preview',
        component: expect.any(Function),
        data: { content: true },
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
        data: { content: true },
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
    expect(real.component).toBe(SurfaceRouteStub);
    expect(real.canMatch).toHaveLength(1);
    expect(placeholder.path).toBe('secret');
    expect(placeholder.component).toBe(SurfaceRouteStub);
    expect(placeholder.data).toEqual({ content: true });
    expect(placeholder.canMatch).toBeUndefined();
  });

  it('gives the placeholder of a gated route the same child addresses as the route itself', () => {
    const [real, placeholder] = buildContentRoutes([
      {
        path: 'doc/:id',
        component: TestRoute,
        subRoutes: ['code', 'preview'],
        rest: true,
        access: { authenticated: true },
      },
    ]);

    expect(placeholder.component).toBe(SurfaceRouteStub);
    expect(placeholder.children).toEqual(real.children);
    expect(placeholder.children?.map((child) => child.path)).toEqual([
      '',
      'code',
      'preview',
      '**',
    ]);
  });

  it("gives the placeholder of a gated container its children's segments", () => {
    const [, placeholder] = buildContentRoutes([
      {
        path: 'ws/:id',
        container: { children: [{ surface: 'a', segment: 'general' }, 'b'] },
        access: { authenticated: true },
      } as never,
    ]);

    expect(placeholder.children?.map((child) => child.path)).toEqual([
      '',
      'general',
    ]);
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
    expect(routes[0].component).toBe(SurfaceRouteStub);
    expect(routes[0].data).toEqual({ content: true });
  });

  it('keeps omitted placeholders behind the registered routes', () => {
    const routes = buildContentRoutes(
      [{ path: 'search', component: TestRoute }],
      [{ id: 'testbed.notes', path: 'notes', component: TestRoute }],
    );

    expect(routes.map((route) => route.path)).toEqual(['search', 'notes']);
  });
});
