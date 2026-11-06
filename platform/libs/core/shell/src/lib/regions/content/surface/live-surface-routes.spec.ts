import { TestBed } from '@angular/core/testing';
import { RegisteredContentRoute } from '../../../contributions/contribution-registry';
import { RetainedViewStash } from '../../pane/retention/retained-view-stash';
import { SurfaceAddress } from './live-surface-route';
import { LiveSurfaceRoutes } from './live-surface-routes';

const route = { path: 'doc/:id' } as unknown as RegisteredContentRoute;

function at(path: string): SurfaceAddress {
  return { path, carriesAddress: false, queryParams: {}, fragment: null };
}

describe('the live routes pane views share', () => {
  let lives: LiveSurfaceRoutes;
  let kept: string[];
  const remembered = () =>
    (lives as unknown as { bound: Map<string, unknown> }).bound.size;

  beforeEach(() => {
    kept = [];
    vi.spyOn(TestBed.inject(RetainedViewStash), 'keyedInstances').mockImplementation(
      () => kept.map((key) => ({ key, instance: {} })),
    );
    lives = TestBed.inject(LiveSurfaceRoutes);
  });

  it('hand a pane view the route a kept surface still reads, and a fresh one once nothing reads it', () => {
    const first = lives.bind(route, 'k', at('doc/a'));
    kept = ['k'];
    lives.unbind('k', first);

    expect(lives.bind(route, 'k', at('doc/a'))).toBe(first);

    lives.unbind('k', first);
    kept = [];

    expect(lives.bind(route, 'k', at('doc/a'))).not.toBe(first);
  });

  it('forget a route nothing reads any more the next time any pane view binds', () => {
    const first = lives.bind(route, 'k', at('doc/a'));
    kept = ['k'];
    lives.unbind('k', first);
    expect(remembered()).toBe(1);
    kept = [];

    lives.bind(route, 'other', at('doc/b'));

    expect(remembered()).toBe(1);
  });
});
