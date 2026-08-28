import { InjectionToken } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { ContentRoute, DirtySurface, View } from '@loomweaver/plugin-sdk';
import { matchRoute } from '../../content/content-path';
import { VIEW_PANE_PREFIX } from '../tree/pane-address';
import { surfaceForPanePath } from '../pane-surface';
import { containerDockFor } from '../container/container-children';

export type RetentionDefault = 'destroy' | 'retain';

export const SURFACE_RETENTION = new InjectionToken<RetentionDefault>(
  'lw.surface-retention',
  {
    providedIn: 'root',
    factory: () => 'destroy',
  },
);

export const PRIMARY_RETENTION_PREFIX = 'primary:';

export function isContentRoute(route: ActivatedRouteSnapshot): boolean {
  return route.routeConfig?.data?.['content'] === true;
}

export function reusableRoute(route: ActivatedRouteSnapshot): boolean {
  if (!isContentRoute(route)) {
    return false;
  }

  if (route.routeConfig?.data?.['authPlaceholder'] === true) {
    return false;
  }

  if (route.routeConfig?.data?.['sub'] === true) {
    return false;
  }

  if (route.routeConfig?.data?.['iframe'] !== undefined) {
    return false;
  }

  if (route.routeConfig?.data?.['retain'] === true) {
    return false;
  }
  return route.routeConfig?.data?.['chromeless'] !== true;
}

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
  if (path.startsWith(VIEW_PANE_PREFIX)) {
    return 'move';
  }
  const route = matchRoute(routes, path);
  if (!route || route.container !== undefined) {
    return 'rebuild';
  }
  return route.iframe === undefined ? 'move' : 'in-place';
}

export function containerChildInstances(
  entries: readonly { key: string; instance: unknown }[],
  tabPath: string,
): unknown[] {
  const scoped = containerDockFor(tabPath) + ':';
  return entries
    .filter((entry) => entry.key.startsWith(scoped))
    .map((entry) => entry.instance);
}

export function paneRetentionScope(dock: string, paneId: string): string {
  return `${dock}:${paneId}`;
}

export function surfaceRetentionKey(scope: string, path: string): string {
  return `${scope}|${path}`;
}

export function viewRetentionKey(
  scope: string,
  path: string,
  instance: string | undefined,
): string {
  return `${scope}|${path}|${instance ?? ''}`;
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

export function dirtySurfaceOf(instance: unknown): DirtySurface | null {
  if (!instance || typeof instance !== 'object') {
    return null;
  }
  const candidate = instance as Partial<DirtySurface>;
  return typeof candidate.surfaceDirty === 'function'
    ? (candidate as DirtySurface)
    : null;
}

export function beforeCloseOf(
  instance: unknown,
): (() => boolean | Promise<boolean>) | null {
  if (!instance || typeof instance !== 'object') {
    return null;
  }
  const candidate = instance as Partial<DirtySurface>;
  return typeof candidate.surfaceBeforeClose === 'function'
    ? candidate.surfaceBeforeClose.bind(candidate)
    : null;
}

export function instanceDirty(instance: unknown): boolean {
  const aware = dirtySurfaceOf(instance);
  if (!aware) {
    return false;
  }
  try {
    return aware.surfaceDirty() === true;
  } catch (error) {
    console.error(
      'surfaceDirty() threw — treating the instance as dirty',
      error,
    );
    return true;
  }
}
