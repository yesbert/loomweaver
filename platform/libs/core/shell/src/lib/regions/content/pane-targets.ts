import { ContainerSpec, ContentRoute, View } from '@loomweaver/plugin-sdk';
import { containerChildren, isAddressable } from '../pane/container/container-children';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { MenuListEntry } from '../../menu/menu.service';
import { VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { resolveTitle } from '../pane/drag/pane-label';
import { matchRoute } from './content-path';

export interface PaneTarget {
  readonly path: string;
  readonly title?: string;
  readonly titleIsLiteral?: boolean;
  readonly icon?: string;
}

function viewTarget(view: View): PaneTarget {
  return {
    path: VIEW_PANE_PREFIX + view.id,
    title: view.title,
    icon: view.icon,
  };
}

export function offRouterMountable(
  registry: ContributionRegistry,
  auth: AuthContext,
  path: string,
): boolean {
  const route = barePathHostableRoute(registry, path);
  return route !== null && auth.meets(route.access);
}

export function offRouterPaneTargets(
  registry: ContributionRegistry,
  auth: AuthContext,
): PaneTarget[] {
  const routes = registry
    .contentRoutes()
    .filter((route) => offRouterMountable(registry, auth, route.path))
    .map((route) => routeTarget(route));

  const views = registry
    .views()
    .filter((view) => auth.meets(view.access))
    .map((view) => viewTarget(view));
  return [...routes, ...views];
}

export function containerChildTargets(
  registry: ContributionRegistry,
  auth: AuthContext,
  spec: ContainerSpec | undefined,
): PaneTarget[] {
  const views = registry.views();
  return containerChildren(spec)
    .filter(
      (child) => child.segment === undefined || isAddressable(child.segment),
    )
    .map((child) => views.find((view) => view.id === child.surface))
    .filter(
      (view): view is View => view !== undefined && auth.meets(view.access),
    )
    .map((view) => viewTarget(view));
}

export function routerPaneTargets(
  registry: ContributionRegistry,
  auth: AuthContext,
): PaneTarget[] {
  return registry
    .contentRoutes()
    .filter(
      (route) =>
        barePathHostableRoute(registry, route.path) !== null &&
        auth.meets(route.access),
    )
    .map((route) => routeTarget(route));
}

export function paneTargetEntries(
  targets: readonly PaneTarget[],
  translate: (key: string) => string,
): MenuListEntry[] {
  return targets.map((target) => ({
    key: target.path,
    label: paneTargetLabel(target, translate),
    icon: target.icon,
  }));
}

function barePathHostableRoute(
  registry: ContributionRegistry,
  path: string,
): ContentRoute | null {
  const route = matchRoute(registry.contentRoutes(), path);
  if (
    !route ||
    route.chromeless === true ||
    path.includes('/') ||
    route.path.includes(':') ||
    route.subRoutes?.length
  ) {
    return null;
  }
  return route.component || route.loadComponent ? route : null;
}

function routeTarget(route: ContentRoute): PaneTarget {
  return {
    path: route.path,
    title: route.title,
    titleIsLiteral: route.titleIsLiteral,
    icon: route.icon,
  };
}

function paneTargetLabel(
  target: PaneTarget,
  translate: (key: string) => string,
): string {
  if (!target.title) {
    return target.path || translate('content.split.home');
  }
  return resolveTitle(
    { title: target.title, literalTitle: target.titleIsLiteral ?? false },
    translate,
  );
}
