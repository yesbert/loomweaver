import { ContributionRegistry } from '../../contributions/contribution-registry';
import { declaringRoute } from '../../regions/content/content-path';
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
    return declaringRoute(routes, path) !== undefined;
  };
}
