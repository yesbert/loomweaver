import { untracked } from '@angular/core';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { matchRoute } from '../../regions/content/content-path';
import { viewIdOfPanePath } from '../../regions/pane/tree/pane-address';

export function pathOwnedBy(
  registry: ContributionRegistry,
  pluginId: string,
): (path: string) => boolean {
  const routes = registry
    .contentRoutes()
    .filter((route) => route.pluginId === pluginId);
  const viewIds = new Set(
    registry
      .views()
      .filter((view) => view.pluginId === pluginId)
      .map((view) => view.id),
  );
  return (path) => {
    if (path === '') {
      return false;
    }
    const viewId = viewIdOfPanePath(path);
    if (viewId !== null) {
      return viewIds.has(viewId);
    }
    return matchRoute(routes, path) !== undefined;
  };
}

export function surfaceOwnedBy(
  registry: ContributionRegistry,
  pluginId: string,
  surfaceId: string,
): boolean {
  return untracked(() =>
    [...registry.views(), ...registry.contentRoutes()].some(
      (surface) => surface.id === surfaceId && surface.pluginId === pluginId,
    ),
  );
}
