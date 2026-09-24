import { ContentRoute, View } from '@loomweaver/plugin-sdk';
import {
  effectiveRetain,
  retainSurfacePath,
  routeRetains,
  surfaceRetentionMode,
} from './retention-policy';

class ProbeView {}

const route = (fields: Partial<ContentRoute>): ContentRoute =>
  ({ path: 'p', ...fields }) as ContentRoute;

describe('routeRetains', () => {
  it('keeps what the route declares, and the default for what it leaves open', () => {
    expect(routeRetains(route({}), 'destroy')).toBe(false);
    expect(routeRetains(route({ retain: 'always' }), 'destroy')).toBe(true);
    expect(
      routeRetains(route({ iframe: '/f.html', retain: 'always' }), 'destroy'),
    ).toBe(true);
    expect(routeRetains(route({}), 'retain')).toBe(true);
    expect(routeRetains(route({ retain: 'never' }), 'retain')).toBe(false);
  });

  it('never retains a container, whatever it declares', () => {
    expect(
      routeRetains(
        route({ container: { children: ['a'] }, retain: 'always' } as never),
        'retain',
      ),
    ).toBe(false);
  });
});

describe('surfaceRetentionMode', () => {
  it('moves views and component routes, parks iframes in place, rebuilds containers', () => {
    const routes = [
      { path: 'notes', component: ProbeView },
      { path: 'frame', iframe: '/frame.html' },
      {
        path: 'ws/:id',
        container: { children: ['a'] },
      },
    ] as unknown as ContentRoute[];

    expect(surfaceRetentionMode(routes, 'view:outline')).toBe('move');
    expect(surfaceRetentionMode(routes, 'notes')).toBe('move');
    expect(surfaceRetentionMode(routes, 'frame')).toBe('in-place');
    expect(surfaceRetentionMode(routes, 'ws/42')).toBe('rebuild');
    expect(surfaceRetentionMode([], 'unknown')).toBe('rebuild');
  });
});

describe('retention policy', () => {
  const routes = [
    { path: 'notes', component: ProbeView },
    { path: 'editor', component: ProbeView, retain: 'always' },
    { path: 'scratch', component: ProbeView, retain: 'never' },
    { path: 'frame', iframe: '/frame.html', retain: 'always' },
    { path: 'ws/:id', container: { children: ['a'] }, retain: 'always' },
  ] as unknown as ContentRoute[];
  const views = [
    { id: 'outline', region: 'primary', title: 't' },
    { id: 'inspector', region: 'primary', title: 't', retain: 'always' },
  ] as unknown as View[];

  it('lets the surface declaration win over the distribution default', () => {
    expect(effectiveRetain(undefined, 'destroy')).toBe(false);
    expect(effectiveRetain(undefined, 'retain')).toBe(true);
    expect(effectiveRetain('always', 'destroy')).toBe(true);
    expect(effectiveRetain('never', 'retain')).toBe(false);
  });

  it('resolves retention per path — iframe surfaces included, unknown paths never', () => {
    expect(retainSurfacePath(routes, views, 'notes', 'destroy')).toBe(false);
    expect(retainSurfacePath(routes, views, 'notes', 'retain')).toBe(true);
    expect(retainSurfacePath(routes, views, 'editor', 'destroy')).toBe(true);
    expect(retainSurfacePath(routes, views, 'scratch', 'retain')).toBe(false);
    expect(retainSurfacePath(routes, views, 'frame', 'destroy')).toBe(true);
    expect(retainSurfacePath(routes, views, 'ws/42', 'retain')).toBe(false);
    expect(retainSurfacePath(routes, views, 'view:outline', 'destroy')).toBe(
      false,
    );
    expect(retainSurfacePath(routes, views, 'view:inspector', 'destroy')).toBe(
      true,
    );
    expect(retainSurfacePath(routes, views, 'unknown', 'retain')).toBe(false);
  });
});
