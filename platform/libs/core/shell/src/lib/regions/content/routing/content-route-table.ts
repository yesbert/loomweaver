import { ActivatedRouteSnapshot, Route, Routes } from '@angular/router';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { RegisteredContentRoute } from '../../../plugin/contribution-registry';
import { containerChildren } from '../../pane/container/container-children';
import { accessCanMatch } from '../access/content-access';
import { ContentSubStub } from './content-sub-stub';
import { keepPopout } from './keep-popout.guard';
import { settleWorkspace } from './settle-workspace.guard';
import { SurfaceRouteStub } from './surface-route-stub';

const CONTENT_DATA = { content: true };

export function isContentRoute(route: ActivatedRouteSnapshot): boolean {
  return route.routeConfig?.data?.['content'] === true;
}

export function routePlaceholder(path: string): Route {
  return {
    path,
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
    const angular: Route = {
      path: route.path,
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
        path: route.path,
        component: SurfaceRouteStub,
        canActivate: [keepPopout],
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
