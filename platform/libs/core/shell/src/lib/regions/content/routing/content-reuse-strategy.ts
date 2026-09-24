import { Service } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy,
} from '@angular/router';
import { isContentRoute } from './content-route-table';

@Service()
export class ContentReuseStrategy implements RouteReuseStrategy {
  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    current: ActivatedRouteSnapshot,
  ): boolean {
    if (!isContentRoute(future) || !isContentRoute(current)) {
      return future.routeConfig === current.routeConfig;
    }
    return (
      future.routeConfig === current.routeConfig && sameParams(future, current)
    );
  }

  shouldDetach(): boolean {
    return false;
  }

  store(): void {
    return;
  }

  shouldAttach(): boolean {
    return false;
  }

  retrieve(): DetachedRouteHandle | null {
    return null;
  }
}

function sameParams(
  a: ActivatedRouteSnapshot,
  b: ActivatedRouteSnapshot,
): boolean {
  const ap = a.params;
  const bp = b.params;
  const keys = Object.keys(ap);
  return (
    keys.length === Object.keys(bp).length && keys.every((k) => ap[k] === bp[k])
  );
}
