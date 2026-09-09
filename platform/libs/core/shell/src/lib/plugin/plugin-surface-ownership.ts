import { ContributionRegistry } from './contribution-registry';
import { matchRoute } from '../regions/content/content-path';
import { VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';

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
    if (path.startsWith(VIEW_PANE_PREFIX)) {
      return viewIds.has(path.slice(VIEW_PANE_PREFIX.length));
    }
    return matchRoute(routes, path) !== undefined;
  };
}
