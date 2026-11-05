import { DestroyRef, EnvironmentInjector, Injector } from '@angular/core';
import { ActivatedRoute, ChildrenOutletContexts } from '@angular/router';
import {
  RegisteredContentRoute,
  RegisteredView,
} from '../../../contributions/contribution-registry';
import { syntheticDockedRoute } from './synthetic-route';
import { LiveSurfaceRoute, SurfaceAddress } from './live-surface-route';
import { LiveSurfaceRoutes } from './live-surface-routes';

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
  const lives = parent.get(LiveSurfaceRoutes);
  const releaseUnless = (kept: (key: string) => boolean): void => {
    for (const byKey of cache.values()) {
      for (const [key, mount] of byKey) {
        if (kept(key)) {
          continue;
        }
        byKey.delete(key);
        lives.unbind(key, mount.live);
      }
    }
  };
  parent.get(DestroyRef).onDestroy(() => releaseUnless(() => false));
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
      const live = lives.bind(route, key, address);
      const mount = {
        live,
        injector: routeInjector(parent, environmentInjector, live.route),
      };
      byKey.set(key, mount);
      return mount;
    },
    releaseUnless,
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
