import { EnvironmentInjector, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { VIEW_STATE } from '@loomweaver/plugin-sdk';
import { RegisteredContentRoute } from '../../../plugin/contribution-registry';
import { surfaceInjectorFactory } from './surface-injector';

function routeFor(path: string): RegisteredContentRoute {
  return { path, component: class {} } as RegisteredContentRoute;
}

describe('surfaceInjectorFactory', () => {
  let factory: ReturnType<typeof surfaceInjectorFactory>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    factory = surfaceInjectorFactory(
      TestBed.inject(Injector),
      TestBed.inject(EnvironmentInjector),
    );
  });

  it('provides a synthetic ActivatedRoute for the mounted path', () => {
    const injector = factory(routeFor('doc/:id'), 'doc/main');
    expect(injector.get(ActivatedRoute).snapshot.paramMap.get('id')).toBe(
      'main',
    );
  });

  it('caches one injector per route and path, so a remount keeps the same instance', () => {
    const route = routeFor('doc/:id');
    expect(factory(route, 'doc/main')).toBe(factory(route, 'doc/main'));
    expect(factory(route, 'doc/main')).not.toBe(factory(route, 'doc/other'));
  });

  it('a re-registered route object at the same path gets a fresh injector (plugin update)', () => {
    expect(factory(routeFor('doc/:id'), 'doc/main')).not.toBe(
      factory(routeFor('doc/:id'), 'doc/main'),
    );
  });

  it('does not provide VIEW_STATE — a routable surface has none by design', () => {
    const injector = factory(routeFor('doc/:id'), 'doc/main');
    expect(() => injector.get(VIEW_STATE)).toThrow();
    expect(injector.get(VIEW_STATE, null)).toBeNull();
  });
});
