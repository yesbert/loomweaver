import { EnvironmentInjector, Injector } from '@angular/core';
import { ActivatedRoute, ChildrenOutletContexts } from '@angular/router';
import {
  RegisteredContentRoute,
  RegisteredView,
} from '../../../plugin/contribution-registry';
import {
  SyntheticRouteOptions,
  syntheticDockedRoute,
  syntheticRouteFor,
} from './synthetic-route';

export type SurfaceInjectorFactory = (
  route: RegisteredContentRoute,
  path: string,
  instanceId?: string,
) => Injector;

export function surfaceInjectorFactory(
  parent: Injector,
  environmentInjector: EnvironmentInjector,
  options?: SyntheticRouteOptions,
): SurfaceInjectorFactory {
  const cache = new Map<RegisteredContentRoute, Map<string, Injector>>();
  return (route, path, instanceId) => {
    let byPath = cache.get(route);
    if (!byPath) {
      byPath = new Map();
      cache.set(route, byPath);
    }
    const key = `${path}|${instanceId ?? ''}`;
    const cached = byPath.get(key);
    if (cached) {
      return cached;
    }
    const injector = Injector.create({
      parent,
      providers: [
        {
          provide: ActivatedRoute,
          useValue: syntheticRouteFor(route, path, { ...options, instanceId }),
        },
        {
          provide: ChildrenOutletContexts,
          useValue: new ChildrenOutletContexts(environmentInjector),
        },
      ],
    });
    byPath.set(key, injector);
    return injector;
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
