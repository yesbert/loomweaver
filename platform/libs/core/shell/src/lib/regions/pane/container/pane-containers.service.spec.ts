import { TestBed } from '@angular/core/testing';
import { CONTENT_DOCK, PRIMARY_PANE, VIEW_PANE_PREFIX } from '../tree/pane-address';
import { PaneLeaf, PaneSplit } from '../tree/pane-node';
import { PaneTreeService } from '../tree/pane-tree.service';
import { PaneContainersService } from './pane-containers.service';
import { containerDockFor } from './container-children';



describe('PaneContainersService (container docks)', () => {
  beforeEach(() => localStorage.clear());

  it('keys a container dock by its content path', () => {
    expect(containerDockFor('workspace/alpha')).toBe(
      'container@workspace/alpha',
    );
  });

  it('seeds the nested tree from initial children, each with its own instance', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('workspace/alpha');

    containers.ensureContainer(dock, {
      children: ['wsCanvas', 'wsDetails'],
      initial: ['wsCanvas', 'wsDetails'],
    });

    const leaf = paneTree.tree(dock) as PaneLeaf;
    expect(leaf.tabs.map((tab) => tab.path)).toEqual([
      `${VIEW_PANE_PREFIX}wsCanvas`,
      `${VIEW_PANE_PREFIX}wsDetails`,
    ]);
    expect(leaf.tabs[0].instance).toBe(`${dock}::wsCanvas`);
    expect(leaf.tabs[1].instance).toBe(`${dock}::wsDetails`);
  });

  it('seeds a declared arrangement as a real split, pointer on the first area', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('workspace/alpha');

    containers.ensureContainer(dock, {
      children: ['wsCanvas', 'wsDetails'],
      initial: {
        columns: [
          { size: 70, tabs: ['wsCanvas'] },
          { size: 30, tabs: ['wsDetails'] },
        ],
      },
    });

    expect(paneTree.isSplit(dock)).toBe(true);
    const root = paneTree.tree(dock) as PaneSplit;
    expect(root.orientation).toBe('row');
    expect(root.ratio).toBeCloseTo(0.7, 5);
    expect(paneTree.primaryId(dock)).toBe(PRIMARY_PANE);
    expect((root.first as PaneLeaf).id).toBe(PRIMARY_PANE);
    expect((root.second as PaneLeaf).tabs[0].instance).toBe(
      `${dock}::wsDetails`,
    );
  });

  it('does not reseed an existing container tree', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('workspace/alpha');
    containers.ensureContainer(dock, {
      children: ['wsCanvas'],
      initial: ['wsCanvas'],
    });
    paneTree.splitPane(dock, PRIMARY_PANE, 'row', `${VIEW_PANE_PREFIX}extra`);

    containers.ensureContainer(dock, {
      children: ['wsCanvas', 'wsDetails'],
      initial: ['wsCanvas', 'wsDetails'],
    });

    expect(paneTree.isSplit(dock)).toBe(true);
  });

  it('closes a child from the primary leaf but keeps at least one (S2)', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('workspace/alpha');
    containers.ensureContainer(dock, {
      children: ['a', 'b'],
      initial: ['a', 'b'],
    });

    paneTree.removeTab(dock, PRIMARY_PANE, `${VIEW_PANE_PREFIX}b`);
    expect((paneTree.tree(dock) as PaneLeaf).tabs.map((t) => t.path)).toEqual(
      [`${VIEW_PANE_PREFIX}a`],
    );

    paneTree.removeTab(dock, PRIMARY_PANE, `${VIEW_PANE_PREFIX}a`);
    expect((paneTree.tree(dock) as PaneLeaf).tabs.length).toBe(1);
  });

  it('closing the last primary child in a split promotes the neighbour', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('workspace/alpha');
    containers.ensureContainer(dock, { children: ['a'], initial: ['a'] });
    paneTree.splitPane(dock, PRIMARY_PANE, 'row', `${VIEW_PANE_PREFIX}b`);
    expect(paneTree.isSplit(dock)).toBe(true);

    paneTree.removeTab(dock, PRIMARY_PANE, `${VIEW_PANE_PREFIX}a`);

    expect(paneTree.isSplit(dock)).toBe(false);
    const leaf = paneTree.tree(dock) as PaneLeaf;
    expect(leaf.id).not.toBe(PRIMARY_PANE);
    expect(paneTree.primaryId(dock)).toBe(leaf.id);
    expect(leaf.tabs.map((t) => t.path)).toEqual([`${VIEW_PANE_PREFIX}b`]);
  });

  it('unpins a pinned tab in place (a travelled pin stays releasable)', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.setPrimaryTabs(CONTENT_DOCK, [{ path: 'doc/a', pinned: true }]);

    paneTree.unpinTab(CONTENT_DOCK, PRIMARY_PANE, 'doc/a');

    expect(paneTree.primaryTabs(CONTENT_DOCK)[0].pinned).toBeUndefined();
  });

  it('opens an addressable child into the pane declared empty, and focuses it when reopened', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('browse/alpha');
    const spec = {
      children: [
        { surface: 'list', segment: 'list' },
        { surface: 'item', segment: 'item/:itemId' },
      ],
      initial: {
        columns: [{ tabs: ['list'] }, { tabs: [] }],
      },
    };
    containers.ensureContainer(dock, spec);

    containers.openContainerChild(dock, spec, 'item/e-01', {
      title: 'e-01',
      titleIsLiteral: true,
    });
    containers.openContainerChild(dock, spec, 'item/e-02');
    containers.openContainerChild(dock, spec, 'item/e-01');

    const tree = paneTree.tree(dock) as PaneSplit;
    const landing = tree.second as PaneLeaf;
    expect((tree.first as PaneLeaf).tabs.map((t) => t.path)).toEqual([
      'browse/alpha/list',
    ]);
    expect(landing.tabs.map((t) => t.path)).toEqual([
      'browse/alpha/item/e-01',
      'browse/alpha/item/e-02',
    ]);
    expect(landing.active).toBe('browse/alpha/item/e-01');
    expect(landing.tabs[0].title).toBe('e-01');
  });

  it('keeps the landing pane when its last child closes', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('browse/beta');
    const spec = {
      children: [{ surface: 'item', segment: 'item/:itemId' }],
      initial: { columns: [{ tabs: [] }, { tabs: [] }] },
    };
    containers.ensureContainer(dock, spec);
    containers.openContainerChild(dock, spec, 'item/e-01');
    const landing = (paneTree.tree(dock) as PaneSplit).first as PaneLeaf;

    paneTree.removeTab(dock, landing.id, 'browse/beta/item/e-01');

    const tree = paneTree.tree(dock) as PaneSplit;
    expect(tree.kind).toBe('split');
    expect((tree.first as PaneLeaf).tabs).toEqual([]);
  });

  it('inserts a child with a container-scoped instance (S2 reopen)', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('workspace/alpha');
    const spec = { children: ['a', 'b'], initial: ['a'] };
    containers.ensureContainer(dock, spec);

    containers.insertContainerChild(dock, spec, PRIMARY_PANE, 'b');

    const tabs = (paneTree.tree(dock) as PaneLeaf).tabs;
    expect(
      tabs.find((t) => t.path === `${VIEW_PANE_PREFIX}b`)?.instance,
    ).toBe(`${dock}::b`);
  });

  it('drops a container dock (GC) and persists the removal', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const containers = TestBed.inject(PaneContainersService);
    const dock = containerDockFor('workspace/alpha');
    containers.ensureContainer(dock, {
      children: ['wsCanvas'],
      initial: ['wsCanvas'],
    });
    expect(paneTree.dockTrees()[dock]).toBeDefined();

    containers.dropContainer(dock);

    expect(paneTree.dockTrees()[dock]).toBeUndefined();
    expect(localStorage.getItem('lw.shell.pane-trees:default')).not.toContain(
      dock,
    );
  });
});
