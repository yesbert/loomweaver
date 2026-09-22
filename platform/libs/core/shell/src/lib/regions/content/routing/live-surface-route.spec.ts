import { firstValueFrom } from 'rxjs';
import { RegisteredContentRoute } from '../../../plugin/contribution-registry';
import { liveSurfaceRoute, SurfaceAddress } from './live-surface-route';

const entry = {
  path: 'entry/:id',
  pluginId: 'testbed',
  subRoutes: ['detail', 'meta'],
} as unknown as RegisteredContentRoute;

function at(
  path: string,
  overrides: Partial<SurfaceAddress> = {},
): SurfaceAddress {
  return {
    path,
    carriesAddress: false,
    queryParams: {},
    fragment: null,
    ...overrides,
  };
}

describe('a live surface route', () => {
  it('reads the tab address, its values and its sub-address', () => {
    const live = liveSurfaceRoute(entry, at('entry/7/meta'), 'k');

    const snapshot = live.route.snapshot;
    expect(snapshot.url.map((segment) => segment.path)).toEqual(['entry', '7']);
    expect(snapshot.paramMap.get('id')).toBe('7');
    expect(snapshot.data).toEqual({
      pluginId: 'testbed',
      sub: 'meta',
      instanceId: 'k',
    });
    expect(snapshot.routeConfig).toBeNull();
    expect(live.route.firstChild?.snapshot.url.map((s) => s.path)).toEqual([
      'meta',
    ]);
  });

  it('follows a new sub-address through its snapshot and its streams', async () => {
    const live = liveSurfaceRoute(entry, at('entry/7'));
    const seen: unknown[] = [];
    live.route.data.subscribe((data) => {
      seen.push(data['sub']);
    });

    expect(live.route.firstChild).toBeNull();

    live.update(at('entry/7/detail'));

    expect(live.route.snapshot.data['sub']).toBe('detail');
    expect(seen).toEqual([undefined, 'detail']);
    const child = live.route.firstChild;
    expect(
      (await firstValueFrom(child!.url)).map((segment) => segment.path),
    ).toEqual(['detail']);
  });

  it('says whether its pane carries the address, and carries the query and fragment', () => {
    const live = liveSurfaceRoute(entry, at('entry/7'));
    const driven: unknown[] = [];
    const queries: unknown[] = [];
    live.route.data.subscribe((data) => {
      driven.push(data['urlDriven']);
    });
    live.route.queryParams.subscribe((query) => {
      queries.push(query);
    });

    live.update(
      at('entry/7', {
        carriesAddress: true,
        queryParams: { t: '1' },
        fragment: 'top',
      }),
    );

    expect(driven).toEqual([undefined, true]);
    expect(queries).toEqual([{}, { t: '1' }]);
    expect(live.route.snapshot.queryParamMap.get('t')).toBe('1');
    expect(live.route.snapshot.fragment).toBe('top');
  });

  it('emits nothing when the address is unchanged', () => {
    const live = liveSurfaceRoute(entry, at('entry/7/meta'));
    let emissions = 0;
    live.route.data.subscribe(() => emissions++);

    live.update(at('entry/7/meta'));

    expect(emissions).toBe(1);
  });
});
