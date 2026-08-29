import { PRIMARY_PANE } from './pane-address';
import { PaneLeaf, PaneNode, PaneSplit, leafOf } from './pane-node';
import { findLeaf } from './pane-queries';
import { normalizeDockEntry, normalizeNode } from './pane-restore';
import { insertTab, removeTab } from './pane-tabs';

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

describe('pane tree restore', () => {
  it('persists deep-stack ratios below the interactive clamp (sanitise ≠ interactive bounds)', () => {
    const persisted: PaneSplit = { ...threeStack(), ratio: 0.1 } as PaneSplit;
    const restored = normalizeNode(
      structuredClone(persisted),
    ) as PaneSplit;
    expect(restored.ratio).toBeCloseTo(0.1);
  });

  it('normalisation clamps only degenerate ratios (0 / 1 / non-finite)', () => {
    const zero = normalizeNode({ ...threeStack(), ratio: 0 }) as PaneSplit;
    const nan = normalizeNode({
      ...threeStack(),
      ratio: NaN,
    }) as PaneSplit;
    expect(zero.ratio).toBeCloseTo(0.02);
    expect(nan.ratio).toBeCloseTo(0.5);
  });

  it('migrates an old single-content leaf { path } to a one-tab group', () => {
    const migrated = normalizeNode({
      kind: 'leaf',
      id: 'p',
      path: 'doc/1',
    }) as PaneLeaf;
    expect(migrated.tabs).toEqual([{ path: 'doc/1' }]);
    expect(migrated.active).toBe('doc/1');
  });

  it('normalises a tab group, dropping malformed tabs and pinning the active fallback to the first tab', () => {
    const leaf = normalizeNode({
      kind: 'leaf',
      id: 'p',
      active: 'gone',
      tabs: [
        { path: 'a', pinned: true },
        { bad: true },
        { path: 'b', preview: true },
      ],
    }) as PaneLeaf;
    expect(leaf.tabs).toEqual([
      { path: 'a', pinned: true },
      { path: 'b', preview: true },
    ]);
    expect(leaf.active).toBe('a');
  });

  it('stamps a view-pane leaf with its own instance id; content leaves stay unstamped', () => {
    expect(leafOf('p1', 'view:testbed.outline').tabs).toEqual([
      { path: 'view:testbed.outline', instance: 'p1' },
    ]);
    expect(leafOf('p2', 'doc/1').tabs).toEqual([{ path: 'doc/1' }]);
  });

  it('a tab instance travels with the tab on a move and survives normalisation', () => {
    const source = leafOf('src', 'view:testbed.outline');
    const tree: PaneNode = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: source,
      second: {
        kind: 'leaf',
        id: 'dst',
        tabs: [{ path: 'doc/1' }],
        active: 'doc/1',
      },
    };
    const carried = findLeaf(tree, 'src')!.tabs[0];
    const moved = insertTab(
      removeTab(tree, 'src', 'view:testbed.outline', 'dst')!,
      'dst',
      carried,
    );
    expect(findLeaf(moved, 'dst')?.tabs).toContainEqual({
      path: 'view:testbed.outline',
      instance: 'src',
    });

    const roundTripped = normalizeNode(
      structuredClone(moved),
    ) as PaneNode;
    expect(findLeaf(roundTripped, 'dst')?.tabs).toContainEqual({
      path: 'view:testbed.outline',
      instance: 'src',
    });
  });

  it('parses the pre-pointer shape: the bare tree, with the main leaf as the pointer', () => {
    const entry = normalizeDockEntry({
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: { kind: 'leaf', id: PRIMARY_PANE, tabs: [{ path: 'a' }] },
      second: { kind: 'leaf', id: 'side', tabs: [{ path: 'b' }] },
    });
    expect(entry?.primary).toBe(PRIMARY_PANE);
    expect(findLeaf(entry!.node, 'side')).not.toBeNull();
  });

  it('parses the wrapped shape and keeps its pointer', () => {
    const entry = normalizeDockEntry({
      tree: {
        kind: 'split',
        id: 's',
        orientation: 'row',
        ratio: 0.5,
        first: { kind: 'leaf', id: 'a1', tabs: [{ path: 'a' }] },
        second: { kind: 'leaf', id: 'b2', tabs: [{ path: 'b' }] },
      },
      primary: 'b2',
    });
    expect(entry?.primary).toBe('b2');
  });

  it('heals a pointer whose leaf is gone to the first leaf', () => {
    const entry = normalizeDockEntry({
      tree: { kind: 'leaf', id: 'a1', tabs: [{ path: 'a' }] },
      primary: 'vanished',
    });
    expect(entry?.primary).toBe('a1');
  });

  it('rejects a value that is not a tree in either shape', () => {
    expect(normalizeDockEntry('junk')).toBeNull();
    expect(normalizeDockEntry({ tree: 'junk', primary: 'x' })).toBeNull();
  });

  it('normalization keeps closable: false and drops the default', () => {
    const node = normalizeNode({
      kind: 'leaf',
      id: 'main',
      tabs: [
        { path: 'a', closable: false },
        { path: 'b', closable: true },
      ],
      active: 'a',
    }) as PaneLeaf;

    expect(node.tabs[0]).toEqual({ path: 'a', closable: false });
    expect(node.tabs[1]).toEqual({ path: 'b' });
  });
});
