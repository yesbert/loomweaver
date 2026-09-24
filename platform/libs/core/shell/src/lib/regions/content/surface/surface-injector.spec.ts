import { EnvironmentInjector, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { VIEW_STATE } from '@loomweaver/plugin-sdk';
import { RegisteredContentRoute } from '../../../contributions/contribution-registry';
import { SurfaceMounts, surfaceMounts } from './surface-injector';
import { SurfaceAddress } from './live-surface-route';

function routeFor(path: string, extra: object = {}): RegisteredContentRoute {
  return { path, component: class {}, ...extra } as RegisteredContentRoute;
}

function at(path: string): SurfaceAddress {
  return { path, carriesAddress: false, queryParams: {}, fragment: null };
}

describe('surfaceMounts', () => {
  let mounts: SurfaceMounts;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mounts = surfaceMounts(
      TestBed.inject(Injector),
      TestBed.inject(EnvironmentInjector),
    );
  });

  it('provides a live ActivatedRoute for the mounted address', () => {
    const { injector } = mounts.mountFor(
      routeFor('doc/:id'),
      'k',
      at('doc/main'),
    );
    expect(injector.get(ActivatedRoute).snapshot.paramMap.get('id')).toBe(
      'main',
    );
  });

  it('keeps one mount per route and key, so a remount and a new sub-address keep the instance', () => {
    const route = routeFor('doc/:id');
    const first = mounts.mountFor(route, 'k', at('doc/main'));
    expect(mounts.mountFor(route, 'k', at('doc/main/code'))).toBe(first);
    expect(mounts.mountFor(route, 'other', at('doc/main'))).not.toBe(first);
  });

  it('forgets a released key, and keeps the ones asked to stay', () => {
    const route = routeFor('doc/:id');
    const released = mounts.mountFor(route, 'gone', at('doc/a'));
    const kept = mounts.mountFor(route, 'kept', at('doc/b'));

    mounts.releaseUnless((key) => key === 'kept');

    expect(mounts.mountFor(route, 'gone', at('doc/a'))).not.toBe(released);
    expect(mounts.mountFor(route, 'kept', at('doc/b'))).toBe(kept);
  });

  it('a re-registered route object at the same key gets a fresh mount (plugin update)', () => {
    expect(mounts.mountFor(routeFor('doc/:id'), 'k', at('doc/main'))).not.toBe(
      mounts.mountFor(routeFor('doc/:id'), 'k', at('doc/main')),
    );
  });

  it('carries the pluginId and the iframe into the route data', () => {
    const { injector } = mounts.mountFor(
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
    const { injector } = mounts.mountFor(routeFor('notes'), 'k', at('notes'));
    expect('pluginId' in injector.get(ActivatedRoute).snapshot.data).toBe(
      false,
    );
  });

  it('does not provide VIEW_STATE — a routable surface has none by design', () => {
    const { injector } = mounts.mountFor(
      routeFor('doc/:id'),
      'k',
      at('doc/main'),
    );
    expect(() => injector.get(VIEW_STATE)).toThrow();
    expect(injector.get(VIEW_STATE, null)).toBeNull();
  });
});
