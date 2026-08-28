import { PRIMARY_PANE } from './pane-address';
import { PaneLeaf, PaneNode, PaneSplit, leafOf, leafPath } from './pane-node';
import { healedPrimary } from './pane-restore';
import { dethroneLeaf, removeLeaf, splitLeaf } from './pane-structure';
import { removeTab } from './pane-tabs';

function urlPane(): PaneLeaf {
  return {
    kind: 'leaf',
    id: PRIMARY_PANE,
    tabs: [
      {
        path: 'quotes/q7',
        title: 'QT-2024-0007',
        literalTitle: true,
        icon: 'quotes',
      },
      {
        path: 'quotes/q8',
        title: 'QT-2024-0008',
        literalTitle: true,
        icon: 'quotes',
      },
    ],
    active: 'quotes/q7',
  };
}

describe('pane tree structure', () => {
  it('splits a leaf placing the new pane before (left/top edge) or after (right/bottom)', () => {
    const before = splitLeaf(
      leafOf('a', 'home'),
      'a',
      'row',
      'search',
      'before',
    ) as PaneSplit;
    expect(leafPath(before.first as PaneLeaf)).toBe('search');
    expect((before.second as PaneLeaf).id).toBe('a');

    const after = splitLeaf(
      leafOf('a', 'home'),
      'a',
      'column',
      'search',
    ) as PaneSplit;
    expect((after.first as PaneLeaf).id).toBe('a');
    expect(leafPath(after.second as PaneLeaf)).toBe('search');
    expect(after.orientation).toBe('column');
  });

  it('duplicates the tab the split names with its label, not whichever tab the leaf calls active', () => {
    const added = (
      splitLeaf(urlPane(), PRIMARY_PANE, 'row', 'quotes/q8') as PaneSplit
    ).second as PaneLeaf;

    expect(added.id).not.toBe(PRIMARY_PANE);
    expect(added.tabs).toEqual([
      {
        path: 'quotes/q8',
        title: 'QT-2024-0008',
        literalTitle: true,
        icon: 'quotes',
      },
    ]);
  });

  it('carries the label when the pane stores a sub-route and the split asks for the tab root', () => {
    const showing: PaneLeaf = {
      kind: 'leaf',
      id: PRIMARY_PANE,
      tabs: [{ path: 'doc/main/code', title: 'Notes.md', literalTitle: true }],
      active: 'doc/main/code',
    };
    const added = (
      splitLeaf(showing, PRIMARY_PANE, 'row', 'doc/main') as PaneSplit
    ).second as PaneLeaf;

    expect(added.tabs[0]).toEqual({
      path: 'doc/main',
      title: 'Notes.md',
      literalTitle: true,
    });
  });

  it('prefers the tab that matches exactly over one that merely sits under it', () => {
    const showing: PaneLeaf = {
      kind: 'leaf',
      id: 'a',
      tabs: [
        { path: 'quotes/q7', title: 'QT-2024-0007', literalTitle: true },
        { path: 'quotes', title: 'All quotes', literalTitle: true },
      ],
    };
    const added = (splitLeaf(showing, 'a', 'row', 'quotes') as PaneSplit)
      .second as PaneLeaf;

    expect(added.tabs[0].title).toBe('All quotes');
  });

  it('fabricates a fresh tab when the split hosts something the pane does not hold', () => {
    const view = (
      splitLeaf(urlPane(), PRIMARY_PANE, 'column', 'view:outline') as PaneSplit
    ).second as PaneLeaf;
    const other = (
      splitLeaf(urlPane(), PRIMARY_PANE, 'row', 'search') as PaneSplit
    ).second as PaneLeaf;

    expect(view.tabs[0].title).toBeUndefined();
    expect(view.tabs[0].instance).toBe(view.id);
    expect(other.tabs[0].title).toBeUndefined();
  });

  it('collapses a non-primary pane when its last tab leaves (R5); the primary pane stays', () => {
    const tree: PaneSplit = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: { kind: 'leaf', id: PRIMARY_PANE, tabs: [] },
      second: leafOf('side', 'doc/1'),
    };
    expect(removeTab(tree, 'side', 'doc/1', PRIMARY_PANE)).toEqual({
      kind: 'leaf',
      id: PRIMARY_PANE,
      tabs: [],
    });
    expect(
      removeTab(
        { kind: 'leaf', id: PRIMARY_PANE, tabs: [] },
        PRIMARY_PANE,
        'x',
        PRIMARY_PANE,
      ),
    ).toEqual({
      kind: 'leaf',
      id: PRIMARY_PANE,
      tabs: [],
    });
  });

  it('dissolves a split when the primary leaf is removed; the neighbour keeps its id and the pointer heals to it', () => {
    const tree: PaneSplit = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: { kind: 'leaf', id: PRIMARY_PANE, tabs: [] },
      second: leafOf('side', 'doc/1'),
    };
    const collapsed = removeLeaf(tree, PRIMARY_PANE);
    expect(collapsed).toEqual(leafOf('side', 'doc/1'));
    expect(healedPrimary(collapsed as PaneNode, PRIMARY_PANE)).toBe('side');
    expect(
      removeLeaf({ kind: 'leaf', id: PRIMARY_PANE, tabs: [] }, PRIMARY_PANE),
    ).toBeNull();
  });

  it('focus handoff reuses an existing tab by root prefix instead of duplicating it', () => {
    const tree: PaneSplit = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: {
        kind: 'leaf',
        id: PRIMARY_PANE,
        tabs: [{ path: 'doc/app/code', title: 'app.ts', literalTitle: true }],
        active: 'doc/app/code',
      },
      second: leafOf('side', 'search'),
    };
    const focused = dethroneLeaf(tree, PRIMARY_PANE, 'doc/app') as PaneSplit;
    const old = focused.first as PaneLeaf;
    expect(old.tabs.map((t) => t.path)).toEqual(['doc/app/code']);
    expect(old.active).toBe('doc/app/code');
    expect(old.tabs[0].title).toBe('app.ts');
    expect((focused.second as PaneLeaf).id).toBe('side');
  });

  it('focus handoff leaves no tab behind for the home screen', () => {
    const tree: PaneSplit = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: { kind: 'leaf', id: PRIMARY_PANE, tabs: [], active: undefined },
      second: leafOf('side', 'search'),
    };
    const focused = dethroneLeaf(tree, PRIMARY_PANE, '') as PaneSplit;
    expect(focused.kind).toBe('split');
    const old = focused.first as PaneLeaf;
    expect(old.tabs).toEqual([]);
    expect(old.active).toBeUndefined();
  });

  it('focus handoff leaves the dethroned pane on the tab it was showing (TreeWeaver #42)', () => {
    const tree: PaneSplit = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: {
        kind: 'leaf',
        id: PRIMARY_PANE,
        tabs: [{ path: 'overview' }, { path: 'notes' }],
        active: 'notes',
      },
      second: leafOf('side', 'notes'),
    };
    const old = (dethroneLeaf(tree, PRIMARY_PANE, 'notes') as PaneSplit)
      .first as PaneLeaf;
    expect(old.tabs.map((t) => t.path)).toEqual(['overview', 'notes']);
    expect(old.active).toBe('notes');
  });

  it('focus handoff carries nothing another pane already shows', () => {
    const tree: PaneSplit = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: { kind: 'leaf', id: PRIMARY_PANE, tabs: [], active: undefined },
      second: leafOf('side', 'quotes'),
    };
    const old = (dethroneLeaf(tree, PRIMARY_PANE, 'quotes') as PaneSplit)
      .first as PaneLeaf;
    expect(old.tabs).toEqual([]);
  });

  it('focus handoff still carries content nothing else is showing', () => {
    const tree: PaneSplit = {
      kind: 'split',
      id: 's',
      orientation: 'row',
      ratio: 0.5,
      first: { kind: 'leaf', id: PRIMARY_PANE, tabs: [], active: undefined },
      second: leafOf('side', 'search'),
    };
    const old = (dethroneLeaf(tree, PRIMARY_PANE, 'quotes') as PaneSplit)
      .first as PaneLeaf;
    expect(old.tabs.map((t) => t.path)).toEqual(['quotes']);
    expect(old.active).toBe('quotes');
  });
});
