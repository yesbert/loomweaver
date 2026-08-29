import { ComponentRef, Service, signal, Signal } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy,
} from '@angular/router';
import { normalizePath } from '../content-path';
import {
  instanceDirty,
  isContentRoute,
  reusableRoute,
} from '../../pane/retention/retention-policy';

interface HandleWithRef {
  componentRef?: ComponentRef<unknown>;
}

export interface ParkedHandle {
  readonly key: string;
  readonly instance?: unknown;
}

@Service()
export class ContentReuseStrategy implements RouteReuseStrategy {
  private readonly handles = new Map<string, DetachedRouteHandle>();
  private readonly changes = signal(0);

  readonly version: Signal<number> = this.changes.asReadonly();

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot,
  ): boolean {
    if (!isContentRoute(future) || !isContentRoute(curr)) {
      return future.routeConfig === curr.routeConfig;
    }

    return future.routeConfig === curr.routeConfig && sameParams(future, curr);
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return reusableRoute(route);
  }

  store(
    route: ActivatedRouteSnapshot,
    handle: DetachedRouteHandle | null,
  ): void {
    const key = keyOf(route);
    if (!key) {
      return;
    }
    if (!handle) {
      this.handles.delete(key);
      this.changes.update((value) => value + 1);
      return;
    }
    if (!instanceDirty(instanceOf(handle))) {
      (handle as HandleWithRef).componentRef?.destroy();
      return;
    }
    this.handles.set(key, handle);
    this.changes.update((value) => value + 1);
  }

  parkedHandles(): ParkedHandle[] {
    return [...this.handles.entries()].map(([key, handle]) => ({
      key,
      instance: instanceOf(handle),
    }));
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return reusableRoute(route) && this.handles.has(keyOf(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.handles.get(keyOf(route)) ?? null;
  }

  evict(path: string): void {
    const key = normalizePath(path);
    const handle = this.handles.get(key);
    if (!handle) {
      return;
    }
    (handle as HandleWithRef).componentRef?.destroy();
    this.handles.delete(key);
    this.changes.update((value) => value + 1);
  }

  pruneExcept(isLive: (key: string) => boolean): void {
    for (const [key, handle] of this.handles) {
      if (isLive(key)) {
        continue;
      }

      (handle as HandleWithRef).componentRef?.destroy();
      this.handles.delete(key);
      this.changes.update((value) => value + 1);
    }
  }
}

function keyOf(route: ActivatedRouteSnapshot): string {
  return route.url.map((segment) => segment.path).join('/');
}

function instanceOf(handle: DetachedRouteHandle): unknown {
  return (handle as HandleWithRef).componentRef?.instance;
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
