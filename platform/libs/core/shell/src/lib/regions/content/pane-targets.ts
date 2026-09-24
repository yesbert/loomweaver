import { ContainerSpec, ContentRoute, View } from '@loomweaver/plugin-sdk';
import {
  containerChildren,
  isAddressable,
} from '../pane/container/container-children';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { MenuListEntry } from '../../menu/menu.service';
import { viewPanePath } from '../pane/tree/pane-address';
import { resolveTitle } from '../pane/chrome/tab-label';
import { matchRoute } from './content-path';

export interface PaneTarget {
  readonly path: string;
  readonly title?: string;
  readonly titleIsLiteral?: boolean;
  readonly icon?: string;
}

function viewTarget(view: View): PaneTarget {
  return {
    path: viewPanePath(view.id),
    title: view.title,
    icon: view.icon,
  };
}

export function canHostInPane(
  registry: ContributionRegistry,
  auth: AuthContext,
  path: string,
): boolean {
  const route = paneHostableRoute(registry, path);
  return route !== null && auth.meets(route.access);
}

export function navigablePaneTargets(
  registry: ContributionRegistry,
  auth: AuthContext,
): PaneTarget[] {
  return registry
    .contentRoutes()
    .filter(
      (route) =>
        paneHostableRoute(registry, route.path) !== null &&
        auth.meets(route.access),
    )
    .map((route) => routeTarget(route));
}

export function hostablePaneTargets(
  registry: ContributionRegistry,
  auth: AuthContext,
): PaneTarget[] {
  const views = registry
    .views()
    .filter((view) => auth.meets(view.access))
    .map((view) => viewTarget(view));
  return [...navigablePaneTargets(registry, auth), ...views];
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

export function paneTargetEntries(
  targets: readonly PaneTarget[],
): MenuListEntry[] {
  return targets.map((target) => ({
    key: target.path,
    label: (translate) => paneTargetLabel(target, translate),
    icon: target.icon,
  }));
}

function paneHostableRoute(
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
