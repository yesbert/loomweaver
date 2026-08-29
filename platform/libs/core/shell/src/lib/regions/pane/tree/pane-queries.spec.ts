import { PaneNode, leafOf } from './pane-node';
import { collectTabPaths, collectTabs, paneSegments } from './pane-queries';

function threeStack(): PaneNode {
  return {
    kind: 'split',
    id: 's1',
    orientation: 'column',
    ratio: 0.5,
    first: { kind: 'leaf', id: 'a', tabs: [] },
    second: {
      kind: 'split',
      id: 's2',
      orientation: 'column',
      ratio: 0.5,
      first: leafOf('b', 'view:x'),
      second: leafOf('c', 'view:x'),
    },
  };
}

describe('pane tree queries', () => {
  it('flattens a tree into ordered segments whose fractions multiply down the ratio chain', () => {
    const segments = paneSegments(threeStack());
    expect(segments.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(segments.map((s) => s.fraction)).toEqual([0.5, 0.25, 0.25]);
    expect(segments[1].path).toBe('view:x');
  });

  it('a single primary leaf is one full-size segment following the dock content (no path)', () => {
    expect(paneSegments({ kind: 'leaf', id: 'main', tabs: [] })).toEqual([
      { id: 'main', path: undefined, fraction: 1 },
    ]);
  });

  it('collectTabPaths walks every tab in every leaf', () => {
    const tree: PaneNode = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: { kind: 'leaf', id: 'a', tabs: [{ path: 'x' }, { path: 'y' }] },
      second: leafOf('b', 'view:z'),
    };
    expect(collectTabPaths(tree).toSorted()).toEqual(['view:z', 'x', 'y']);
  });

  it('collectTabs returns the full tab objects across every leaf', () => {
    const tree: PaneNode = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: {
        kind: 'leaf',
        id: 'a',
        tabs: [{ path: 'x', title: 'X', pinned: true }],
      },
      second: { kind: 'leaf', id: 'b', tabs: [{ path: 'y' }] },
    };
    expect(collectTabs(tree)).toEqual([
      { path: 'x', title: 'X', pinned: true },
      { path: 'y' },
    ]);
  });
});
