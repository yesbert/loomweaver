import { ContentRoute } from '@loomweaver/plugin-sdk';
import { View } from '../../layout/view';
import {
  ContainerChildDeclaration,
  childForSegmentPath,
} from './container/container-children';
import {
  isHomePath,
  matchRoute,
  restBelow,
  tabRootOf,
} from '../content/content-path';
import { VIEW_PANE_PREFIX, viewForPanePath } from './tree/pane-address';

export interface ContainerChildMatch<V> {
  readonly child: V;
  readonly declaration: ContainerChildDeclaration;
  readonly containerPath: string;
  readonly segmentPath: string;
}

export function containerChildForPath<V extends View, R extends ContentRoute>(
  routes: readonly R[],
  views: readonly V[],
  path: string,
): ContainerChildMatch<V> | undefined {
  const route = matchRoute(routes, path);
  if (!route?.container) {
    return undefined;
  }
  const containerPath = tabRootOf(routes, path);
  const segmentPath = restBelow(containerPath, path);
  if (segmentPath === '') {
    return undefined;
  }
  const matched = childForSegmentPath(route.container, views, segmentPath);
  return matched ? { ...matched, containerPath, segmentPath } : undefined;
}

export function surfaceForPanePath<V extends View, R extends ContentRoute>(
  routes: readonly R[],
  views: readonly V[],
  path: string,
): V | R | undefined {
  if (path.startsWith(VIEW_PANE_PREFIX)) {
    return viewForPanePath(views, path);
  }
  const route = matchRoute(routes, path);
  if (!route) {
    return undefined;
  }
  if (isHomePath(route.path) && !isHomePath(path)) {
    return undefined;
  }
  if (route.container) {
    return restBelow(tabRootOf(routes, path), path) === ''
      ? route
      : containerChildForPath(routes, views, path)?.child;
  }
  return route;
}
