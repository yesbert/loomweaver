import { Component } from '@angular/core';
import { Surface } from '@loomweaver/plugin-sdk';
import {
  CONTAINER_CHILD_REGION,
  contentRouteToEntry,
  entryToContentRoute,
  entryToView,
  isRoutableSurface,
  surfaceToEntry,
  viewToEntry,
} from './surface-normalize';

const surfaceToContentRoute = (surface: Surface) =>
  entryToContentRoute(surfaceToEntry(surface));
const surfaceToView = (surface: Surface) => entryToView(surfaceToEntry(surface));

@Component({ selector: 'lw-test-surface', template: '' })
class TestSurfaceComponent {}

describe('surface-normalize', () => {
  it('classifies a routable surface', () => {
    const routable: Surface = {
      id: 's',
      title: 't',
      routable: { path: 'p' },
      component: TestSurfaceComponent,
    };
    const view: Surface = {
      id: 's',
      title: 't',
      docks: ['primary'],
      component: TestSurfaceComponent,
    };
    expect(isRoutableSurface(routable)).toBe(true);
    expect(isRoutableSurface(view)).toBe(false);
  });

  it('maps a routable component surface to a content route (title/icon fall back to the surface)', () => {
    const surface: Surface = {
      id: 'reports',
      title: 'weaver.reports',
      icon: 'chart',
      access: { anyRole: ['admin'] },
      routable: { path: 'reports', chromeless: true, subRoutes: ['a', 'b'] },
      component: TestSurfaceComponent,
    };
    const route = surfaceToContentRoute(surface);
    expect(route).toEqual({
      id: 'reports',
      path: 'reports',
      chromeless: true,
      title: 'weaver.reports',
      icon: 'chart',
      titleIsLiteral: undefined,
      subRoutes: ['a', 'b'],
      access: { anyRole: ['admin'] },
      component: TestSurfaceComponent,
    });
  });

  it('prefers routable title/icon over the surface defaults', () => {
    const surface: Surface = {
      id: 's',
      title: 'surface.title',
      icon: 'surfaceIcon',
      routable: {
        path: 'p',
        title: 'route.title',
        icon: 'routeIcon',
        titleIsLiteral: true,
      },
      component: TestSurfaceComponent,
    };
    const route = surfaceToContentRoute(surface);
    expect(route.title).toBe('route.title');
    expect(route.icon).toBe('routeIcon');
    expect(route.titleIsLiteral).toBe(true);
  });

  it('passes an iframe routable surface through as an iframe route', () => {
    const surface: Surface = {
      id: 's',
      title: 't',
      routable: { path: 'p' },
      iframe: '/plugins/x/plugin.html',
    };
    const route = surfaceToContentRoute(surface);
    expect(route).toMatchObject({
      path: 'p',
      iframe: '/plugins/x/plugin.html',
    });
    expect('component' in route).toBe(false);
  });

  it('carries the surface id onto the route — the handle omit addresses it by', () => {
    const surface: Surface = {
      id: 'testbed.notes',
      title: 't',
      routable: { path: 'notes' },
      component: TestSurfaceComponent,
    };
    expect(surfaceToContentRoute(surface).id).toBe('testbed.notes');
  });

  it('maps a non-routable surface to a panel view docked into its home dock', () => {
    const surface: Surface = {
      id: 'outline',
      title: 'weaver.outline',
      icon: 'outline',
      order: 1,
      instanceable: true,
      access: { authenticated: true },
      actions: [{ id: 'a', icon: 'add', title: 'add' }],
      docks: ['primary', 'secondary'],
      component: TestSurfaceComponent,
    };
    const view = surfaceToView(surface);
    expect(view).toEqual({
      id: 'outline',
      region: 'primary',
      title: 'weaver.outline',
      order: 1,
      icon: 'outline',
      actions: [{ id: 'a', icon: 'add', title: 'add' }],
      access: { authenticated: true },
      instanceable: true,
      component: TestSurfaceComponent,
    });
  });

  it('rejects a non-routable surface without docks (no home region)', () => {
    const surface: Surface = {
      id: 's',
      title: 't',
      component: TestSurfaceComponent,
    };
    expect(() => surfaceToView(surface)).toThrow(
      /no home region|declares no docks/,
    );
  });

  it('maps a non-routable iframe surface to a docked view', () => {
    const surface: Surface = {
      id: 's',
      title: 't',
      docks: ['primary'],
      iframe: '/x.html',
    };
    const view = surfaceToView(surface);
    expect(view).toMatchObject({ region: 'primary', iframe: '/x.html' });
    expect(view.component).toBeUndefined();
  });

  it('maps a routable container surface to a container content route', () => {
    const surface: Surface = {
      id: 'testbed.workspace',
      title: 'testbed.workspace.title',
      routable: { path: 'workspace/:id' },
      container: { children: ['a', 'b'], initial: ['a'] },
    };
    const route = surfaceToContentRoute(surface);
    expect(route).toMatchObject({
      path: 'workspace/:id',
      container: { children: ['a', 'b'], initial: ['a'] },
    });
    expect('component' in route).toBe(false);
    expect('iframe' in route).toBe(false);
  });

  it('rejects a container surface that is not routable (a container holds its own :id)', () => {
    const surface: Surface = {
      id: 's',
      title: 't',
      docks: [],
      container: { children: [] },
    };
    expect(() => surfaceToView(surface)).toThrow(/container but not routable/);
  });

  it('maps a child-only surface (docks: []) to an unplaced view', () => {
    const surface: Surface = {
      id: 'testbed.wsCanvas',
      title: 'testbed.workspace.canvas',
      docks: [],
      component: TestSurfaceComponent,
    };
    expect(surfaceToView(surface).region).toBe(CONTAINER_CHILD_REGION);
  });

  it('projects a docked entry back to the view it was normalised from', () => {
    const view = {
      id: 'outline',
      region: 'primary',
      title: 'weaver.outline',
      order: 2,
      icon: 'outline',
      actions: [{ id: 'a', icon: 'add', title: 'add' }],
      access: { authenticated: true },
      instanceable: true,
      retain: 'always',
      saveOn: 'hide',
      component: TestSurfaceComponent,
    } as const;
    expect(entryToView(viewToEntry(view))).toEqual(view);
  });

  it('projects a routable entry back to the route it was normalised from', () => {
    const route = {
      id: 'reports',
      path: 'reports/:id',
      chromeless: true,
      order: 4,
      title: 'route.title',
      icon: 'chart',
      titleIsLiteral: true,
      subRoutes: ['a', 'b'],
      access: { anyRole: ['admin'] },
      retain: 'never',
      saveOn: 'hide',
      component: TestSurfaceComponent,
    } as const;
    expect(entryToContentRoute(contentRouteToEntry(route))).toEqual(route);
  });

  it('leaves a route without a default title without one (no empty-string stand-in)', () => {
    const entry = contentRouteToEntry({
      path: 'p',
      component: TestSurfaceComponent,
    });
    expect(entryToContentRoute(entry).title).toBeUndefined();
  });

  it('hands the same projection back for an unchanged entry', () => {
    const entry = surfaceToEntry({
      id: 's',
      title: 't',
      docks: ['primary'],
      component: TestSurfaceComponent,
    });
    expect(entryToView(entry)).toBe(entryToView(entry));
  });

  it('stamps the owning plugin onto both projections', () => {
    const routable = surfaceToEntry(
      {
        id: 's',
        title: 't',
        routable: { path: 'p' },
        component: TestSurfaceComponent,
      },
      'weaver',
    );
    const docked = surfaceToEntry(
      { id: 'v', title: 't', docks: ['primary'], component: TestSurfaceComponent },
      'weaver',
    );
    expect(entryToContentRoute(routable).pluginId).toBe('weaver');
    expect(entryToView(docked).pluginId).toBe('weaver');
  });
});
