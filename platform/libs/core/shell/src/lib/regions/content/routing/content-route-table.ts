import { ActivatedRouteSnapshot, Route, Routes } from '@angular/router';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { RegisteredContentRoute } from '../../../contributions/contribution-registry';
import { containerChildren } from '../../pane/container/container-children';
import { accessCanMatch } from '../access/content-access';
import { decodeSegment, segmentsOf } from '../content-path';
import { ContentSubStub } from './content-sub-stub';
import { keepPopout } from './keep-popout.guard';
import { settleWorkspace, withholdSettlement } from './settle-workspace.guard';
import { SurfaceRouteStub } from './surface-route-stub';

const CONTENT_DATA = { content: true };

export function isContentRoute(route: ActivatedRouteSnapshot): boolean {
  return route.routeConfig?.data?.['content'] === true;
}

function asTheRouterMatches(address: string): string {
  return segmentsOf(address)
    .map((segment) => decodeSegment(segment))
    .join('/');
}

export function routePlaceholder(address: string): Route {
  return {
    path: asTheRouterMatches(address),
    component: SurfaceRouteStub,
    canActivate: [keepPopout, settleWorkspace],
    data: CONTENT_DATA,
  };
}

export function buildContentRoutes(
  contentRoutes: readonly RegisteredContentRoute[],
  omitted: readonly ContentRoute[] = [],
): Routes {
  return [
    ...buildRegisteredRoutes(contentRoutes),
    ...omitted.map((route) => routePlaceholder(route.path)),
  ];
}

function buildRegisteredRoutes(
  contentRoutes: readonly RegisteredContentRoute[],
): Routes {
  return contentRoutes.flatMap((route) => {
    const path = asTheRouterMatches(route.path);
    const angular: Route = {
      path,
      component: SurfaceRouteStub,
      canActivate: [keepPopout, settleWorkspace],
      data: CONTENT_DATA,
    };
    const children = childRoutes(route);
    if (children.length) {
      angular.children = children;
    }

    if (route.access) {
      angular.canMatch = [accessCanMatch(route.access)];
      const placeholder: Route = {
        path,
        component: SurfaceRouteStub,
        canActivate: [keepPopout, withholdSettlement],
        data: CONTENT_DATA,
        ...(children.length && { children }),
      };
      return [angular, placeholder];
    }
    return [angular];
  });
}

function childRoutes(route: RegisteredContentRoute): Routes {
  const subs = [...(route.subRoutes ?? []), ...containerSubs(route)];
  const children: Routes = subs.map((sub) => subStub(sub));
  if (subs.length) {
    children.unshift(subStub('', 'full'));
  }
  if (route.rest === true) {
    children.push(subStub('**'));
  }
  return children;
}

function subStub(path: string, pathMatch?: 'full'): Route {
  return {
    path,
    ...(pathMatch && { pathMatch }),
    component: ContentSubStub,
    data: CONTENT_DATA,
  };
}

function containerSubs(route: RegisteredContentRoute): readonly string[] {
  return containerChildren(route.container)
    .map((child) => child.segment)
    .filter((segment): segment is string => segment !== undefined);
}
