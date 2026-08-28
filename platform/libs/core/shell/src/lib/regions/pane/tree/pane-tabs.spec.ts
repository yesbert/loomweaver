import { PaneLeaf, PaneNode, leafOf } from './pane-node';
import { findLeaf } from './pane-queries';
import {
  keepTab,
  pinTab,
  clearTabInstance,
  insertTab,
  removeTab,
  setActiveTab,
  unpinTab,
} from './pane-tabs';

describe('pane tabs', () => {
  it('clearTabInstance drops only the addressed tab instance (switcher returns to the named world)', () => {
    const leaf: PaneLeaf = {
      kind: 'leaf',
      id: 'p',
      tabs: [
        { path: 'view:testbed.outline', instance: 'carried' },
        { path: 'view:testbed.info', instance: 'other' },
      ],
      active: 'view:testbed.outline',
    };
    const cleared = clearTabInstance(
      leaf,
      'p',
      'view:testbed.outline',
    ) as PaneLeaf;
    expect(cleared.tabs).toEqual([
      { path: 'view:testbed.outline' },
      { path: 'view:testbed.info', instance: 'other' },
    ]);
  });

  it('inserts a tab at an index and makes it active; re-inserting a path replaces it in place', () => {
    const start = leafOf('p', 'a');
    const withB = insertTab(start, 'p', { path: 'b' });
    const withC = insertTab(withB, 'p', { path: 'c' }, 1);
    const leaf = findLeaf(withC, 'p') as PaneLeaf;
    expect(leaf.tabs.map((t) => t.path)).toEqual(['a', 'c', 'b']);
    expect(leaf.active).toBe('c');

    const replaced = findLeaf(
      insertTab(withC, 'p', { path: 'a', pinned: true }),
      'p',
    ) as PaneLeaf;
    expect(replaced.tabs.map((t) => t.path)).toEqual(['a', 'c', 'b']);
    expect(replaced.tabs[0]).toEqual({ path: 'a', pinned: true });
  });

  it('sets the active tab and removing the active one re-picks a neighbour', () => {
    const group = insertTab(
      insertTab(leafOf('p', 'a'), 'p', { path: 'b' }),
      'p',
      { path: 'c' },
    );
    const active = findLeaf(setActiveTab(group, 'p', 'b'), 'p') as PaneLeaf;
    expect(active.active).toBe('b');

    const removed = findLeaf(
      removeTab(active, 'p', 'b', 'p') as PaneNode,
      'p',
    ) as PaneLeaf;
    expect(removed.tabs.map((t) => t.path)).toEqual(['a', 'c']);
    expect(removed.active).toBe('a');
  });
});

describe('tab permanence outside the URL pane', () => {
  const leaf: PaneLeaf = {
    kind: 'leaf',
    id: 'side',
    tabs: [
      { path: 'doc/a', preview: true },
      { path: 'doc/b', pinned: true },
    ],
    active: 'doc/a',
  };

  it('keepTab promotes a preview tab and leaves the rest alone', () => {
    const next = keepTab(leaf, 'side', 'doc/a') as PaneLeaf;
    expect(next.tabs[0]).toEqual({ path: 'doc/a' });
    expect(next.tabs[1]).toEqual({ path: 'doc/b', pinned: true });
  });

  it('pinTab anchors a tab and promotes it in the same move', () => {
    const next = pinTab(leaf, 'side', 'doc/a') as PaneLeaf;
    expect(next.tabs).toEqual([
      { path: 'doc/b', pinned: true },
      { path: 'doc/a', pinned: true },
    ]);
  });

  it('unpinTab returns a tab to the front of the unpinned band', () => {
    const stack: PaneLeaf = {
      kind: 'leaf',
      id: 'side',
      tabs: [
        { path: 'doc/a', pinned: true },
        { path: 'doc/b', pinned: true },
        { path: 'doc/c' },
      ],
      active: 'doc/a',
    };
    const next = unpinTab(stack, 'side', 'doc/a') as PaneLeaf;
    expect(next.tabs).toEqual([
      { path: 'doc/b', pinned: true },
      { path: 'doc/a' },
      { path: 'doc/c' },
    ]);
  });
});
