import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { buildContentRoutes } from '../../content/routing/content-router';
import { ContentTabsService } from '../../content/tabs/content-tabs.service';
import { PRIMARY_PANE } from '../tree/pane-address';
import { PaneLeaf, PaneSplit, leafPath } from '../tree/pane-node';
import { findLeaf, paneSegments } from '../tree/pane-queries';
import { CONTENT_DOCK } from '../tree/pane-address';
import { PaneTreeService } from '../tree/pane-tree.service';
import { PaneContainersService } from '../container/pane-containers.service';
import { PaneMoveService, stripIdOf, stripSourceOf } from './pane-move.service';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'doc/:id', component: TestContent },
  { path: 'ndoc/:id', component: TestContent },
  { path: 'plain', component: TestContent },
  {
    path: 'dashboard/overview',
    component: TestContent,
  },
];

describe('PaneMoveService (move semantics)', () => {
  let paneMove: PaneMoveService;
  let paneTree: PaneTreeService;
  let tabs: ContentTabsService;
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(buildContentRoutes(ROUTES))],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    paneMove = TestBed.inject(PaneMoveService);
    paneTree = TestBed.inject(PaneTreeService);
    tabs = TestBed.inject(ContentTabsService);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  it('parses a strip drop-list id back into its pane', () => {
    expect(stripSourceOf('pane-strip:content:main')).toEqual({
      dock: 'content',
      paneId: 'main',
    });
    expect(stripSourceOf('panel-views-primary')).toBeNull();
  });

  it('round-trips a colon-free container dock so inner drag resolves its source', () => {
    const source = { dock: 'container@workspace/alpha', paneId: 'main' };
    expect(stripSourceOf(stripIdOf(source))).toEqual(source);
  });

  it('splits a tab out of a pane that is not the address-carrying one, beside that pane', async () => {
    await harness.navigateByUrl('/dashboard/overview');
    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'doc/x');
    const pane = paneTree.sourceOf('doc/x');
    if (pane === null) {
      throw new Error('the split pane did not take doc/x');
    }
    paneTree.insertTab(CONTENT_DOCK, pane.paneId, 'doc/y');

    paneMove.splitTabOut('doc/y', 'column', pane);

    expect(paneSegments(paneTree.tree(CONTENT_DOCK))).toHaveLength(3);
    const from = findLeaf(paneTree.tree(CONTENT_DOCK), pane.paneId);
    expect(from?.tabs.map((t) => t.path)).toEqual(['doc/x']);
    const added = paneTree.sourceOf('doc/y');
    expect(added).not.toBeNull();
    expect(added?.paneId).not.toBe(pane.paneId);
    expect(
      findLeaf(paneTree.tree(CONTENT_DOCK), added?.paneId ?? '')?.tabs.map(
        (t) => t.path,
      ),
    ).toEqual(['doc/y']);
  });

  it('menu "Split right" MOVES a router-bound URL tab into a new group + hands it the focus (R2/R4/E3)', async () => {
    await harness.navigateByUrl('/dashboard/overview');
    tabs.open({ path: 'doc/a', title: 'A.ts', titleIsLiteral: true });
    await harness.fixture.whenStable();

    paneMove.splitTabOut('doc/a', 'row');
    await harness.fixture.whenStable();

    const root = paneTree.tree(CONTENT_DOCK) as PaneSplit;
    expect(root.kind).toBe('split');
    const primary = paneSegments(root).find(() => true);
    expect(primary).toBeDefined();
    const primaryTabs = paneTree.primaryTabs(CONTENT_DOCK);
    expect(primaryTabs.map((t) => t.path)).toEqual(['doc/a']);
    expect(primaryTabs[0].title).toBe('A.ts');
    expect(router.url).toBe('/doc/a');
    const other = paneSegments(root).find(
      (segment) => segment.id !== paneTree.primaryId(CONTENT_DOCK),
    );
    expect(other?.path).toBe('dashboard/overview');
  });

  it('a strip drop into the URL group MOVES the tab there and navigates to it (R3a/R9), collapsing the source (R5)', async () => {
    await harness.navigateByUrl('/dashboard/overview');
    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'plain');
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);

    const secondary = (
      (paneTree.tree(CONTENT_DOCK) as PaneSplit).second as PaneLeaf
    ).id;
    paneMove.moveToStrip({ dock: CONTENT_DOCK, paneId: secondary }, 'plain', {
      dock: CONTENT_DOCK,
      paneId: PRIMARY_PANE,
    });
    await harness.fixture.whenStable();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
    expect(paneTree.primaryTabs(CONTENT_DOCK).map((t) => t.path)).toContain(
      'plain',
    );
    expect(router.url).toBe('/plain');
  });

  it('an edge drop moves a host-renderable tab into a new sibling group; the URL follows the neighbour when its active tab left (R3b)', async () => {
    await harness.navigateByUrl('/dashboard/overview');
    await harness.fixture.whenStable();
    await harness.navigateByUrl('/plain');
    await harness.fixture.whenStable();

    paneMove.moveToEdge(
      { dock: CONTENT_DOCK, paneId: PRIMARY_PANE },
      'plain',
      { dock: CONTENT_DOCK, paneId: PRIMARY_PANE },
      'right',
    );
    await harness.fixture.whenStable();

    const root = paneTree.tree(CONTENT_DOCK) as PaneSplit;
    expect(root.kind).toBe('split');
    expect(root.first.id).toBe(PRIMARY_PANE);
    expect(leafPath(root.second as PaneLeaf)).toBe('plain');
    expect(router.url).toBe('/dashboard/overview');
  });

  it('a same-pane edge drag of the sole tab with no fallback is a no-op', async () => {
    await harness.navigateByUrl('/ndoc/a');
    await harness.fixture.whenStable();

    paneMove.moveToEdge(
      { dock: CONTENT_DOCK, paneId: PRIMARY_PANE },
      'ndoc/a',
      { dock: CONTENT_DOCK, paneId: PRIMARY_PANE },
      'right',
    );

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
  });

  it('moving the last URL tab away collapses the emptied group instead of fabricating a Home pane', async () => {
    await harness.navigateByUrl('/ndoc/a');
    await harness.fixture.whenStable();
    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'plain');
    const secondary = (
      (paneTree.tree(CONTENT_DOCK) as PaneSplit).second as PaneLeaf
    ).id;

    paneMove.moveToStrip(
      { dock: CONTENT_DOCK, paneId: PRIMARY_PANE },
      'ndoc/a',
      { dock: CONTENT_DOCK, paneId: secondary },
    );
    await harness.fixture.whenStable();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
    const paths = paneTree.primaryTabs(CONTENT_DOCK).map((t) => t.path);
    expect(paths).toContain('ndoc/a');
    expect(paths).not.toContain('');
    expect(router.url).toBe('/ndoc/a');
  });

  it('moving the last child out of a container primary promotes the neighbour', () => {
    const containers = TestBed.inject(PaneContainersService);
    const dock = 'container@runs/1';
    containers.ensureContainer(dock, { children: ['a'], initial: ['a'] });
    paneTree.splitPane(dock, PRIMARY_PANE, 'row', 'view:b');
    const second = ((paneTree.tree(dock) as PaneSplit).second as PaneLeaf).id;

    paneMove.moveToStrip({ dock, paneId: PRIMARY_PANE }, 'view:a', {
      dock,
      paneId: second,
    });

    expect(paneTree.isSplit(dock)).toBe(false);
    const leaf = paneTree.tree(dock) as PaneLeaf;
    expect(leaf.id).toBe(second);
    expect(paneTree.primaryId(dock)).toBe(second);
    expect(
      leaf.tabs.map((t) => t.path).toSorted((a, b) => a.localeCompare(b)),
    ).toEqual(['view:a', 'view:b']);
  });

  it('a preview tab promotes when it moves out of the URL group', async () => {
    await harness.navigateByUrl('/dashboard/overview');
    tabs.open({
      path: 'doc/a',
      title: 'A.ts',
      titleIsLiteral: true,
      preview: true,
    });
    await harness.fixture.whenStable();
    expect(
      paneTree.primaryTabs(CONTENT_DOCK).find((t) => t.path === 'doc/a')
        ?.preview,
    ).toBe(true);

    paneMove.moveToStrip(
      { dock: CONTENT_DOCK, paneId: PRIMARY_PANE },
      'doc/a',
      { dock: 'primary', paneId: PRIMARY_PANE },
    );
    await harness.fixture.whenStable();

    const moved = paneTree
      .primaryTabs('primary')
      .find((t) => t.path === 'doc/a');
    expect(moved).toBeDefined();
    expect(moved?.preview).toBeUndefined();
  });

  describe('a preview moved between panes', () => {
    const SIDE = 'side';
    const OTHER = 'other';

    function leafTabs(paneId: string) {
      return findLeaf(paneTree.tree(CONTENT_DOCK), paneId)?.tabs ?? [];
    }

    function previewOf(paneId: string, path: string) {
      return leafTabs(paneId).find((t) => t.path === path)?.preview;
    }

    function arrange(...leaves: PaneLeaf[]): void {
      const [first, ...rest] = leaves;
      let node: PaneLeaf | PaneSplit = first;
      for (const [index, leaf] of rest.entries()) {
        node = {
          kind: 'split',
          id: `split-${index}`,
          orientation: 'row',
          ratio: 0.5,
          first: node,
          second: leaf,
        };
      }
      paneTree.commitTree(CONTENT_DOCK, node);
    }

    beforeEach(async () => {
      await harness.navigateByUrl('/dashboard/overview');
    });

    it('arrives kept on the strip of the address pane that shows a preview of its own', async () => {
      arrange(
        {
          kind: 'leaf',
          id: PRIMARY_PANE,
          tabs: [{ path: 'dashboard/overview' }, { path: 'doc/a', preview: true }],
          active: 'dashboard/overview',
        },
        {
          kind: 'leaf',
          id: SIDE,
          tabs: [{ path: 'doc/b', preview: true }, { path: 'plain' }],
          active: 'doc/b',
        },
      );

      paneMove.moveToStrip({ dock: CONTENT_DOCK, paneId: SIDE }, 'doc/b', {
        dock: CONTENT_DOCK,
        paneId: PRIMARY_PANE,
      });
      await harness.fixture.whenStable();

      const address = paneTree.primaryId(CONTENT_DOCK);
      expect(leafTabs(address).filter((t) => t.preview)).toEqual([
        expect.objectContaining({ path: 'doc/a' }),
      ]);
      expect(previewOf(address, 'doc/b')).toBeUndefined();
    });

    it('arrives kept between two panes that do not carry the address, on a strip and on an edge', () => {
      arrange(
        {
          kind: 'leaf',
          id: PRIMARY_PANE,
          tabs: [{ path: 'dashboard/overview' }],
          active: 'dashboard/overview',
        },
        {
          kind: 'leaf',
          id: SIDE,
          tabs: [
            { path: 'doc/b', preview: true },
            { path: 'ndoc/c', preview: true },
            { path: 'plain' },
          ],
          active: 'plain',
        },
        {
          kind: 'leaf',
          id: OTHER,
          tabs: [{ path: 'doc/d' }],
          active: 'doc/d',
        },
      );

      paneMove.moveToStrip({ dock: CONTENT_DOCK, paneId: SIDE }, 'doc/b', {
        dock: CONTENT_DOCK,
        paneId: OTHER,
      });
      paneMove.moveToEdge(
        { dock: CONTENT_DOCK, paneId: SIDE },
        'ndoc/c',
        { dock: CONTENT_DOCK, paneId: OTHER },
        'bottom',
      );

      expect(leafTabs(OTHER).find((t) => t.path === 'doc/b')).toBeDefined();
      expect(previewOf(OTHER, 'doc/b')).toBeUndefined();
      const edge = paneTree.sourceOf('ndoc/c');
      expect(edge?.paneId).not.toBe(SIDE);
      expect(previewOf(edge?.paneId ?? '', 'ndoc/c')).toBeUndefined();
    });

    it('arrives kept when split out through the command, as by dragging onto an edge', () => {
      arrange(
        {
          kind: 'leaf',
          id: PRIMARY_PANE,
          tabs: [{ path: 'dashboard/overview' }],
          active: 'dashboard/overview',
        },
        {
          kind: 'leaf',
          id: SIDE,
          tabs: [{ path: 'doc/b', preview: true }, { path: 'plain' }],
          active: 'plain',
        },
      );

      paneMove.splitTabOut('doc/b', 'row', { dock: CONTENT_DOCK, paneId: SIDE });

      const added = paneTree.sourceOf('doc/b');
      expect(added?.paneId).not.toBe(SIDE);
      expect(previewOf(added?.paneId ?? '', 'doc/b')).toBeUndefined();
    });

    it('stays a preview when reordered within its own strip', () => {
      arrange({
        kind: 'leaf',
        id: PRIMARY_PANE,
        tabs: [{ path: 'dashboard/overview' }, { path: 'doc/a', preview: true }],
        active: 'dashboard/overview',
      });

      paneTree.reorderPaneTabs(CONTENT_DOCK, PRIMARY_PANE, [
        'doc/a',
        'dashboard/overview',
      ]);

      expect(leafTabs(PRIMARY_PANE).map((t) => t.path)).toEqual([
        'doc/a',
        'dashboard/overview',
      ]);
      expect(previewOf(PRIMARY_PANE, 'doc/a')).toBe(true);
    });
  });
});

describe('PaneMoveService cross-family moves', () => {
  let paneMove: PaneMoveService;
  let paneTree: PaneTreeService;
  let tabs: ContentTabsService;
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(buildContentRoutes(ROUTES))],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const route of ROUTES) registry.addContentRoute(route);
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'outline.title',
      component: TestContent,
    });
    paneMove = TestBed.inject(PaneMoveService);
    paneTree = TestBed.inject(PaneTreeService);
    tabs = TestBed.inject(ContentTabsService);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  it('a view tab dropped on the URL strip joins the URL group and is selected — the URL stays (R3a/R9)', async () => {
    await harness.navigateByUrl('/dashboard/overview');
    paneTree.seedPrimaryTabs('primary', ['view:outline']);

    paneMove.moveToStrip(
      { dock: 'primary', paneId: PRIMARY_PANE },
      'view:outline',
      { dock: CONTENT_DOCK, paneId: PRIMARY_PANE },
    );
    await harness.fixture.whenStable();

    expect(paneTree.primaryTabs('primary')).toEqual([]);
    expect(paneTree.primaryTabs(CONTENT_DOCK).map((t) => t.path)).toContain(
      'view:outline',
    );
    expect(tabs.activeViewPath()).toBe('view:outline');
    expect(router.url).toBe('/dashboard/overview');
  });

  it('a router-bound content tab dropped on a sidebar strip MOVES there and renders host-side (R6/E7)', async () => {
    await harness.navigateByUrl('/dashboard/overview');
    tabs.open({ path: 'doc/a', title: 'A.ts', titleIsLiteral: true });
    await harness.fixture.whenStable();

    paneMove.moveToStrip(
      { dock: CONTENT_DOCK, paneId: PRIMARY_PANE },
      'doc/a',
      { dock: 'primary', paneId: PRIMARY_PANE },
    );
    await harness.fixture.whenStable();

    expect(
      paneTree.primaryTabs(CONTENT_DOCK).some((t) => t.path.startsWith('doc/')),
    ).toBe(false);
    const moved = paneTree
      .primaryTabs('primary')
      .find((t) => t.path === 'doc/a');
    expect(moved?.title).toBe('A.ts');
    expect(router.url).toBe('/dashboard/overview');
  });
});
