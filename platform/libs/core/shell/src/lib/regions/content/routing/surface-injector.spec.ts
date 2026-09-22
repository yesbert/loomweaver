import { EnvironmentInjector, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { VIEW_STATE } from '@loomweaver/plugin-sdk';
import { RegisteredContentRoute } from '../../../plugin/contribution-registry';
import { surfaceInjectorFactory } from './surface-injector';
import { SurfaceAddress } from './live-surface-route';

function routeFor(path: string, extra: object = {}): RegisteredContentRoute {
  return { path, component: class {}, ...extra } as RegisteredContentRoute;
}

function at(path: string): SurfaceAddress {
  return { path, carriesAddress: false, queryParams: {}, fragment: null };
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

  it('provides a live ActivatedRoute for the mounted address', () => {
    const { injector } = factory(routeFor('doc/:id'), 'k', at('doc/main'));
    expect(injector.get(ActivatedRoute).snapshot.paramMap.get('id')).toBe(
      'main',
    );
  });

  it('keeps one mount per route and key, so a remount and a new sub-address keep the instance', () => {
    const route = routeFor('doc/:id');
    const first = factory(route, 'k', at('doc/main'));
    expect(factory(route, 'k', at('doc/main/code'))).toBe(first);
    expect(factory(route, 'other', at('doc/main'))).not.toBe(first);
  });

  it('a re-registered route object at the same key gets a fresh mount (plugin update)', () => {
    expect(factory(routeFor('doc/:id'), 'k', at('doc/main'))).not.toBe(
      factory(routeFor('doc/:id'), 'k', at('doc/main')),
    );
  });

  it('carries the pluginId and the iframe into the route data', () => {
    const { injector } = factory(
      routeFor('sandbox', {
        iframe: 'https://app.example/sandbox/plugin.html',
        pluginId: 'store.demo',
      }),
      'k',
      at('sandbox'),
    );
    const data = injector.get(ActivatedRoute).snapshot.data;
    expect(data['pluginId']).toBe('store.demo');
    expect(data['iframe']).toBe('https://app.example/sandbox/plugin.html');
  });

  it('omits pluginId when the route has none', () => {
    const { injector } = factory(routeFor('notes'), 'k', at('notes'));
    expect('pluginId' in injector.get(ActivatedRoute).snapshot.data).toBe(
      false,
    );
  });

  it('does not provide VIEW_STATE — a routable surface has none by design', () => {
    const { injector } = factory(routeFor('doc/:id'), 'k', at('doc/main'));
    expect(() => injector.get(VIEW_STATE)).toThrow();
    expect(injector.get(VIEW_STATE, null)).toBeNull();
  });
});
