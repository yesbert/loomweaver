import {
  ActivatedRouteSnapshot,
  Route,
  Routes,
  UrlMatcher,
  UrlSegment,
} from '@angular/router';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { RegisteredContentRoute } from '../../../contributions/contribution-registry';
import { containerChildren } from '../../pane/container/container-children';
import { accessCanMatch } from '../access/content-access';
import { decodeSegment, encodeSegment, segmentsOf } from '../content-path';
import { ContentSubStub } from './content-sub-stub';
import { keepPopout } from './keep-popout.guard';
import { settleWorkspace, withholdSettlement } from './settle-workspace.guard';
import { SurfaceRouteStub } from './surface-route-stub';

const CONTENT_DATA = { content: true };

export function isContentRoute(route: ActivatedRouteSnapshot): boolean {
  return route.routeConfig?.data?.['content'] === true;
}

type Matching = Pick<Route, 'path' | 'matcher'>;

function isPatternSyntax(part: string): boolean {
  return part.startsWith(':') || part === '**';
}

function matcherOf(parts: readonly string[], literal: boolean): UrlMatcher {
  return (segments) => {
    if (segments.length < parts.length) {
      return null;
    }
    const posParams: Record<string, UrlSegment> = {};
    for (const [index, part] of parts.entries()) {
      if (!literal && part.startsWith(':')) {
        posParams[decodeSegment(part.slice(1))] = segments[index];
      } else if (encodeSegment(segments[index].path) !== part) {
        return null;
      }
    }
    return { consumed: segments.slice(0, parts.length), posParams };
  };
}

function asTheRouterMatches(address: string, literal = false): Matching {
  const parts = segmentsOf(address);
  const asPath = parts.every(
    (part) =>
      decodeSegment(part) === part && !(literal && isPatternSyntax(part)),
  );
  return asPath ? { path: address } : { matcher: matcherOf(parts, literal) };
}

function placeholder(matching: Matching): Route {
  return {
    ...matching,
    component: SurfaceRouteStub,
    canActivate: [keepPopout, settleWorkspace],
    data: CONTENT_DATA,
  };
}

export function addressPlaceholder(address: string): Route {
  return placeholder(asTheRouterMatches(address, true));
}

export function routePlaceholder(pattern: string): Route {
  return placeholder(asTheRouterMatches(pattern));
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
    const matching = asTheRouterMatches(route.path);
    const angular: Route = {
      ...matching,
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
      const heldBack: Route = {
        ...matching,
        component: SurfaceRouteStub,
        canActivate: [keepPopout, withholdSettlement],
        data: CONTENT_DATA,
        ...(children.length && { children }),
      };
      return [angular, heldBack];
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
