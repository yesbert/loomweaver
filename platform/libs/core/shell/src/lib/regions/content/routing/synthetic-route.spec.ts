import { syntheticRouteFor } from './synthetic-route';
import { RegisteredContentRoute } from '../../../plugin/contribution-registry';

describe('syntheticRouteFor', () => {
  it('carries the pluginId into the synthetic route data (host-mounted session gating)', () => {
    const route = {
      path: 'sandbox',
      iframe: 'https://app.example/sandbox/plugin.html',
      pluginId: 'store.demo',
    } as unknown as RegisteredContentRoute;

    const activated = syntheticRouteFor(route, 'sandbox');

    expect(activated.snapshot.data['pluginId']).toBe('store.demo');
    expect(activated.snapshot.data['iframe']).toBe(
      'https://app.example/sandbox/plugin.html',
    );
  });

  it('omits pluginId when the route has none', () => {
    const route = {
      path: 'notes',
      component: class {},
    } as unknown as RegisteredContentRoute;

    const activated = syntheticRouteFor(route, 'notes');

    expect('pluginId' in activated.snapshot.data).toBe(false);
  });
});
