import { EnvironmentInjector, Injector } from '@angular/core';
import { ActivatedRoute, ChildrenOutletContexts } from '@angular/router';
import {
  RegisteredContentRoute,
  RegisteredView,
} from '../../../contributions/contribution-registry';
import { syntheticDockedRoute } from './synthetic-route';
import {
  LiveSurfaceRoute,
  SurfaceAddress,
  liveSurfaceRoute,
} from './live-surface-route';

export interface SurfaceMount {
  readonly injector: Injector;
  readonly live: LiveSurfaceRoute;
}

export interface SurfaceMounts {
  mountFor(
    route: RegisteredContentRoute,
    key: string,
    address: SurfaceAddress,
  ): SurfaceMount;
  releaseUnless(kept: (key: string) => boolean): void;
}

export function surfaceMounts(
  parent: Injector,
  environmentInjector: EnvironmentInjector,
): SurfaceMounts {
  const cache = new Map<RegisteredContentRoute, Map<string, SurfaceMount>>();
  return {
    mountFor: (route, key, address) => {
      let byKey = cache.get(route);
      if (!byKey) {
        byKey = new Map();
        cache.set(route, byKey);
      }
      const cached = byKey.get(key);
      if (cached) {
        return cached;
      }
      const mount = newMount(route, key, address, parent, environmentInjector);
      byKey.set(key, mount);
      return mount;
    },
    releaseUnless: (kept) => {
      for (const byKey of cache.values()) {
        for (const key of byKey.keys()) {
          if (!kept(key)) {
            byKey.delete(key);
          }
        }
      }
    },
  };
}

function newMount(
  route: RegisteredContentRoute,
  key: string,
  address: SurfaceAddress,
  parent: Injector,
  environmentInjector: EnvironmentInjector,
): SurfaceMount {
  const live = liveSurfaceRoute(route, address, key);
  return {
    live,
    injector: routeInjector(parent, environmentInjector, live.route),
  };
}

function routeInjector(
  parent: Injector,
  environmentInjector: EnvironmentInjector,
  route: ActivatedRoute,
): Injector {
  return Injector.create({
    parent,
    providers: [
      { provide: ActivatedRoute, useValue: route },
      {
        provide: ChildrenOutletContexts,
        useValue: new ChildrenOutletContexts(environmentInjector),
      },
    ],
  });
}

export type DockedSurfaceInjectorFactory = (
  view: RegisteredView,
  instanceId: string,
  params?: Record<string, string>,
) => Injector;

export function dockedSurfaceInjectorFactory(
  parent: Injector,
  environmentInjector: EnvironmentInjector,
): DockedSurfaceInjectorFactory {
  const cache = new Map<string, Injector>();
  return (view, instanceId, params) => {
    const key = `${view.id}|${instanceId}`;
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
    const injector = routeInjector(
      parent,
      environmentInjector,
      syntheticDockedRoute(view, instanceId, params),
    );
    cache.set(key, injector);
    return injector;
  };
}
