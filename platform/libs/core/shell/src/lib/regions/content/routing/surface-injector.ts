import { EnvironmentInjector, Injector } from '@angular/core';
import { ActivatedRoute, ChildrenOutletContexts } from '@angular/router';
import {
  RegisteredContentRoute,
  RegisteredView,
} from '../../../plugin/contribution-registry';
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

export type SurfaceInjectorFactory = (
  route: RegisteredContentRoute,
  key: string,
  address: SurfaceAddress,
) => SurfaceMount;

export function surfaceInjectorFactory(
  parent: Injector,
  environmentInjector: EnvironmentInjector,
): SurfaceInjectorFactory {
  const cache = new Map<RegisteredContentRoute, Map<string, SurfaceMount>>();
  return (route, key, address) => {
    let byKey = cache.get(route);
    if (!byKey) {
      byKey = new Map();
      cache.set(route, byKey);
    }
    const cached = byKey.get(key);
    if (cached) {
      return cached;
    }
    const live = liveSurfaceRoute(route, address, key);
    const mount = {
      live,
      injector: Injector.create({
        parent,
        providers: [
          { provide: ActivatedRoute, useValue: live.route },
          {
            provide: ChildrenOutletContexts,
            useValue: new ChildrenOutletContexts(environmentInjector),
          },
        ],
      }),
    };
    byKey.set(key, mount);
    return mount;
  };
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
    const injector = Injector.create({
      parent,
      providers: [
        {
          provide: ActivatedRoute,
          useValue: syntheticDockedRoute(view, instanceId, params),
        },
        {
          provide: ChildrenOutletContexts,
          useValue: new ChildrenOutletContexts(environmentInjector),
        },
      ],
    });
    cache.set(key, injector);
    return injector;
  };
}
