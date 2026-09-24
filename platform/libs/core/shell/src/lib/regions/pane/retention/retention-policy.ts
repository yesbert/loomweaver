import { InjectionToken } from '@angular/core';
import { ContentRoute, View } from '@loomweaver/plugin-sdk';
import { matchRoute } from '../../content/content-path';
import { isViewPanePath } from '../tree/pane-address';
import { surfaceForPanePath } from '../pane-surface';

export type RetentionDefault = 'destroy' | 'retain';

export const SURFACE_RETENTION = new InjectionToken<RetentionDefault>(
  'lw.surface-retention',
  {
    providedIn: 'root',
    factory: () => 'destroy',
  },
);

export function effectiveRetain(
  declared: 'always' | 'never' | undefined,
  fallback: RetentionDefault,
): boolean {
  return declared === undefined ? fallback === 'retain' : declared === 'always';
}

export function routeRetains(
  route: ContentRoute,
  fallback: RetentionDefault,
): boolean {
  if (route.container !== undefined) {
    return false;
  }
  return effectiveRetain(route.retain, fallback);
}

export function retainSurfacePath(
  routes: readonly ContentRoute[],
  views: readonly View[],
  path: string,
  fallback: RetentionDefault,
): boolean {
  const surface = surfaceForPanePath(routes, views, path);
  if (surface === undefined) {
    return false;
  }
  return 'path' in surface
    ? routeRetains(surface, fallback)
    : effectiveRetain(surface.retain, fallback);
}

export type SurfaceRetentionMode = 'move' | 'in-place' | 'rebuild';

export function surfaceRetentionMode(
  routes: readonly ContentRoute[],
  path: string,
): SurfaceRetentionMode {
  if (isViewPanePath(path)) {
    return 'move';
  }
  const route = matchRoute(routes, path);
  if (!route || route.container !== undefined) {
    return 'rebuild';
  }
  return route.iframe === undefined ? 'move' : 'in-place';
}

export function resolvableSurfacePath(
  routes: readonly ContentRoute[],
  views: readonly View[],
  path: string,
): boolean {
  return surfaceForPanePath(routes, views, path) !== undefined;
}

export function saveOnHidePath(
  routes: readonly ContentRoute[],
  views: readonly View[],
  path: string,
): boolean {
  return surfaceForPanePath(routes, views, path)?.saveOn === 'hide';
}
