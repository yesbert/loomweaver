import { TestBed } from '@angular/core/testing';
import { CONTENT_DOCK, PRIMARY_PANE } from './pane-address';
import { PaneLeaf, PaneNode, PaneSplit, PaneTab } from './pane-node';
import { findLeaf } from './pane-queries';
import { PaneTreeService } from './pane-tree.service';
import { sparedByBulkClose } from './pane-tabs';

const FIXED: PaneTab = { path: 'dashboard/overview', closable: false };
const PINNED: PaneTab = { path: 'doc/pinned', pinned: true };
const ORDINARY: PaneTab = { path: 'doc/ordinary' };

function leaf(id: string, tabs: readonly PaneTab[], active?: string): PaneLeaf {
  return { kind: 'leaf', id, tabs, active: active ?? tabs[0]?.path };
}

function row(first: PaneNode, second: PaneNode): PaneSplit {
  return {
    kind: 'split',
    id: `split-${first.id}-${second.id}`,
    orientation: 'row',
    ratio: 0.5,
    first,
    second,
  };
}

function paths(node: PaneNode, paneId: string): string[] {
  return (findLeaf(node, paneId)?.tabs ?? []).map((tab) => tab.path);
}

function setUp(tree: PaneNode): PaneTreeService {
  localStorage.clear();
  const paneTree = TestBed.inject(PaneTreeService);
  paneTree.commitTree(CONTENT_DOCK, tree);
  return paneTree;
}

describe('Closing a pane hands what cannot close to the pane that takes its space', () => {
  it('a closed pane hands its unclosable and pinned tabs to its neighbour and drops the rest', () => {
    const paneTree = setUp(
      row(
        leaf(PRIMARY_PANE, [{ path: 'search' }]),
        leaf('other', [FIXED, PINNED, ORDINARY]),
      ),
    );

    paneTree.closePane(CONTENT_DOCK, 'other', sparedByBulkClose);

    const tree = paneTree.tree(CONTENT_DOCK);
    expect(tree.kind).toBe('leaf');
    expect(paths(tree, PRIMARY_PANE)).toEqual([
      'search',
      FIXED.path,
      PINNED.path,
    ]);
    expect(findLeaf(tree, PRIMARY_PANE)?.active).toBe('search');
  });

  it("keeps the tabs' own flags, so a handed-over tab still cannot be closed", () => {
    const paneTree = setUp(
      row(leaf(PRIMARY_PANE, [{ path: 'search' }]), leaf('other', [FIXED])),
    );

    paneTree.closePane(CONTENT_DOCK, 'other', sparedByBulkClose);

    expect(
      findLeaf(paneTree.tree(CONTENT_DOCK), PRIMARY_PANE)?.tabs.at(-1),
    ).toEqual(FIXED);
  });

  it('hands over to the adjacent pane of a nested split, not to the far one', () => {
    const paneTree = setUp(
      row(
        leaf(PRIMARY_PANE, [{ path: 'search' }]),
        row(leaf('middle', [{ path: 'doc/a' }]), leaf('right', [FIXED])),
      ),
    );

    paneTree.closePane(CONTENT_DOCK, 'right', sparedByBulkClose);

    const tree = paneTree.tree(CONTENT_DOCK);
    expect(paths(tree, 'middle')).toEqual(['doc/a', FIXED.path]);
    expect(paths(tree, PRIMARY_PANE)).toEqual(['search']);
  });

  it('does not duplicate a tab the neighbour already holds', () => {
    const paneTree = setUp(
      row(leaf(PRIMARY_PANE, [FIXED]), leaf('other', [FIXED])),
    );

    paneTree.closePane(CONTENT_DOCK, 'other', sparedByBulkClose);

    expect(paths(paneTree.tree(CONTENT_DOCK), PRIMARY_PANE)).toEqual([
      FIXED.path,
    ]);
  });

  it('without a rule to keep anything, closing a pane closes all of it as before', () => {
    const paneTree = setUp(
      row(leaf(PRIMARY_PANE, [{ path: 'search' }]), leaf('other', [FIXED])),
    );

    paneTree.closePane(CONTENT_DOCK, 'other');

    expect(paths(paneTree.tree(CONTENT_DOCK), PRIMARY_PANE)).toEqual([
      'search',
    ]);
  });

  it('closing the pane carrying the address hands its fixed tabs to the promoted pane', () => {
    const paneTree = setUp(
      row(
        leaf(PRIMARY_PANE, [FIXED, ORDINARY]),
        leaf('other', [{ path: 'search' }]),
      ),
    );

    const promoted = paneTree.collapsePrimary(CONTENT_DOCK, sparedByBulkClose);

    expect(promoted).toBe('search');
    expect(paneTree.primaryId(CONTENT_DOCK)).toBe('other');
    expect(paths(paneTree.tree(CONTENT_DOCK), 'other')).toEqual([
      'search',
      FIXED.path,
    ]);
  });

  it('undoing a split gathers every spared tab in the remaining pane', () => {
    const paneTree = setUp(
      row(
        leaf(PRIMARY_PANE, [{ path: 'search' }]),
        row(leaf('middle', [PINNED, ORDINARY]), leaf('right', [FIXED])),
      ),
    );

    paneTree.unsplit(CONTENT_DOCK, sparedByBulkClose);

    const tree = paneTree.tree(CONTENT_DOCK);
    expect(tree.kind).toBe('leaf');
    expect(paths(tree, PRIMARY_PANE)).toEqual([
      'search',
      PINNED.path,
      FIXED.path,
    ]);
  });

  it('an emptied receiver shows the first tab it is handed', () => {
    const paneTree = setUp(row(leaf(PRIMARY_PANE, []), leaf('other', [FIXED])));

    paneTree.closePane(CONTENT_DOCK, 'other', sparedByBulkClose);

    expect(findLeaf(paneTree.tree(CONTENT_DOCK), PRIMARY_PANE)?.active).toBe(
      FIXED.path,
    );
  });
});
