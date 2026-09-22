import { ActivatedRouteSnapshot } from '@angular/router';
import { ContentReuseStrategy } from './content-reuse-strategy';

describe('ContentReuseStrategy', () => {
  it('parks nothing — the panes keep the surfaces', () => {
    const strategy = new ContentReuseStrategy();

    expect(strategy.shouldDetach()).toBe(false);
    expect(strategy.shouldAttach()).toBe(false);
    expect(strategy.retrieve()).toBeNull();
  });

  it('keeps a content route only for the same config and the same values', () => {
    const strategy = new ContentReuseStrategy();
    const routeConfig = { data: { content: true } };
    const at = (params: Record<string, string>) =>
      ({ routeConfig, url: [], params }) as unknown as ActivatedRouteSnapshot;

    expect(
      strategy.shouldReuseRoute(at({ id: 'abc' }), at({ id: 'abc' })),
    ).toBe(true);
    expect(
      strategy.shouldReuseRoute(at({ id: 'abc' }), at({ id: 'xyz' })),
    ).toBe(false);
  });

  it('leaves other routes on the default behaviour (same config reused)', () => {
    const strategy = new ContentReuseStrategy();
    const config = {};
    const a = { routeConfig: config, url: [], params: { id: '1' } };
    const b = { routeConfig: config, url: [], params: { id: '2' } };

    expect(
      strategy.shouldReuseRoute(
        a as unknown as ActivatedRouteSnapshot,
        b as unknown as ActivatedRouteSnapshot,
      ),
    ).toBe(true);
  });
});
