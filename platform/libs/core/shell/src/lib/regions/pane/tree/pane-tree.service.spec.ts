import { DOCUMENT } from '@angular/common';
import {
  Component,
  EmbeddedViewRef,
  EnvironmentInjector,
  createComponent,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RetainedViewStash } from '../retention/retained-view-stash';
import { CONTENT_DOCK, PRIMARY_PANE, VIEW_PANE_PREFIX } from './pane-address';
import { PaneLeaf, PaneSplit, leafOf, leafPath } from './pane-node';
import { paneSegments } from './pane-queries';
import { PaneTreeService } from './pane-tree.service';

const KEY = 'lw.shell.pane-trees:default';

const PRIMARY: PaneLeaf = { kind: 'leaf', id: PRIMARY_PANE, tabs: [] };

function secondLeaf(split: PaneSplit): PaneLeaf {
  return split.second as PaneLeaf;
}

function secondId(paneTree: PaneTreeService): string {
  return ((paneTree.tree(CONTENT_DOCK) as PaneSplit).second as PaneLeaf).id;
}

function park(stash: RetainedViewStash, key: string, instance: string): void {
  const view = TestBed.inject(EnvironmentInjector);
  const ref = createComponent(RetentionProbe, { environmentInjector: view });
  ref.instance.tag = instance;
  stash
    .acquire(key, RetentionProbe, () => ({
      view: ref.hostView as EmbeddedViewRef<unknown>,
      instance,
    }))
    .release(true);
}

@Component({ selector: 'lw-pane-probe', template: '' })
class RetentionProbe {
  tag = '';
}

describe('PaneTreeService (one tree per dock)', () => {
  beforeEach(() => localStorage.clear());

  describe('content dock (ex ContentLayoutService)', () => {
    it('starts as a single primary leaf', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
      expect(paneTree.tree(CONTENT_DOCK)).toEqual(PRIMARY);
    });

    it('splits into a primary + secondary row and persists the hosted path', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');

      expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
      const split = paneTree.tree(CONTENT_DOCK) as PaneSplit;
      expect(split.orientation).toBe('row');
      expect(split.first).toEqual(PRIMARY);
      expect(secondLeaf(split)).toMatchObject({
        kind: 'leaf',
        tabs: [{ path: 'search' }],
        active: 'search',
      });
      expect(localStorage.getItem(KEY)).toContain('search');
    });

    it('unsplits back to a single leaf', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
      paneTree.unsplit(CONTENT_DOCK);
      expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
      expect(paneTree.tree(CONTENT_DOCK)).toEqual(PRIMARY);
    });

    it('streams a split ratio (clamped) without persisting, then commits', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
      const rootId = (paneTree.tree(CONTENT_DOCK) as PaneSplit).id;
      localStorage.clear();

      paneTree.resizeStream(CONTENT_DOCK, rootId, 0.05);
      expect((paneTree.tree(CONTENT_DOCK) as PaneSplit).ratio).toBeCloseTo(
        0.15,
      );
      expect(localStorage.getItem(KEY)).toBeNull();

      paneTree.resizeStream(CONTENT_DOCK, rootId, 0.7);
      paneTree.resizeCommit();
      expect((paneTree.tree(CONTENT_DOCK) as PaneSplit).ratio).toBeCloseTo(0.7);
      expect(localStorage.getItem(KEY)).toContain('0.7');
    });

    it('restores a persisted split synchronously via peek', () => {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          [CONTENT_DOCK]: {
            kind: 'split',
            id: 'root',
            orientation: 'row',
            ratio: 0.6,
            first: { kind: 'leaf', id: PRIMARY_PANE, tabs: [] },
            second: leafOf('secondary', 'search'),
          },
        }),
      );
      const paneTree = TestBed.inject(PaneTreeService);
      expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
      const split = paneTree.tree(CONTENT_DOCK) as PaneSplit;
      expect(split.ratio).toBeCloseTo(0.6);
      expect(secondLeaf(split)).toMatchObject({
        kind: 'leaf',
        tabs: [{ path: 'search' }],
        active: 'search',
      });
    });

    it('migrates a legacy single-content leaf { path } from storage', () => {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          [CONTENT_DOCK]: {
            kind: 'split',
            id: 'root',
            orientation: 'row',
            ratio: 0.5,
            first: { kind: 'leaf', id: PRIMARY_PANE },
            second: { kind: 'leaf', id: 'secondary', path: 'search' },
          },
        }),
      );
      const split = TestBed.inject(PaneTreeService).tree(
        CONTENT_DOCK,
      ) as PaneSplit;
      expect(split.first).toEqual(PRIMARY);
      expect(secondLeaf(split)).toMatchObject({
        kind: 'leaf',
        tabs: [{ path: 'search' }],
        active: 'search',
      });
    });

    it('ignores a corrupted payload', () => {
      localStorage.setItem(KEY, '{not json');
      expect(TestBed.inject(PaneTreeService).isSplit(CONTENT_DOCK)).toBe(false);
    });

    it('drops a malformed tree (split missing a child) back to the primary leaf', () => {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          [CONTENT_DOCK]: {
            kind: 'split',
            id: 'root',
            orientation: 'row',
            ratio: 0.5,
            first: { kind: 'leaf', id: PRIMARY_PANE, tabs: [] },
          },
        }),
      );
      expect(TestBed.inject(PaneTreeService).tree(CONTENT_DOCK)).toEqual(
        PRIMARY,
      );
    });

    it('splits a secondary pane along a second axis (2D grid)', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
      paneTree.splitPane(CONTENT_DOCK, secondId(paneTree), 'column', 'search');

      const root = paneTree.tree(CONTENT_DOCK) as PaneSplit;
      expect(root.orientation).toBe('row');
      const inner = root.second as PaneSplit;
      expect(inner.kind).toBe('split');
      expect(inner.orientation).toBe('column');
      expect(leafPath(inner.first as PaneLeaf)).toBe('search');
      expect(leafPath(inner.second as PaneLeaf)).toBe('search');
    });

    it('closes a secondary pane, collapsing its split to the sibling', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
      paneTree.splitPane(CONTENT_DOCK, secondId(paneTree), 'column', 'search');
      const inner = (paneTree.tree(CONTENT_DOCK) as PaneSplit)
        .second as PaneSplit;

      paneTree.closePane(CONTENT_DOCK, inner.first.id);
      const root = paneTree.tree(CONTENT_DOCK) as PaneSplit;
      expect(root.second).toEqual(inner.second);
    });

    it('never closes the primary pane', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
      paneTree.closePane(CONTENT_DOCK, PRIMARY_PANE);
      expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    });
  });

  describe('panel docks (ex PanelStackService — a column-only tree)', () => {
    it('a panel dock has no stack by default (single primary leaf)', () => {
      expect(
        paneSegments(TestBed.inject(PaneTreeService).tree('primary')),
      ).toHaveLength(1);
    });

    it('stacks the SAME view multiple times, each leaf its own instance', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.stackView('primary', 'testbed.library');
      paneTree.stackView('primary', 'testbed.library');

      const segments = paneSegments(paneTree.tree('primary'));
      expect(segments.map((s) => s.path)).toEqual([
        undefined,
        'view:testbed.library',
        'view:testbed.library',
      ]);
      expect(segments[1].id).not.toBe(segments[2].id);
      expect(localStorage.getItem(KEY)).toContain('testbed.library');
    });

    it('stacking splits along the column axis', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.stackView('primary', 'testbed.outline');
      expect((paneTree.tree('primary') as PaneSplit).orientation).toBe(
        'column',
      );
    });

    it('streams a stack-divider resize (the split ratio) without persisting, then commits', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.stackView('primary', 'testbed.outline');
      const splitId = (paneTree.tree('primary') as PaneSplit).id;
      localStorage.clear();

      paneTree.resizeStream('primary', splitId, 0.7);
      const fractions = paneSegments(paneTree.tree('primary')).map(
        (s) => s.fraction,
      );
      expect(fractions[0]).toBeCloseTo(0.7);
      expect(fractions[1]).toBeCloseTo(0.3);
      expect(localStorage.getItem(KEY)).toBeNull();

      paneTree.resizeCommit();
      expect(localStorage.getItem(KEY)).toContain('0.7');
    });

    it('unstacks a single pane by its leaf id, keeping the rest', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.stackView('primary', 'testbed.outline');
      paneTree.stackView('primary', 'testbed.library');
      const [, first, second] = paneSegments(paneTree.tree('primary'));

      paneTree.closePane('primary', first.id);
      expect(paneSegments(paneTree.tree('primary')).map((s) => s.path)).toEqual(
        [undefined, second.path],
      );
    });

    it('unstacking the last pane collapses the dock back to the primary leaf (dropped from storage)', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.stackView('primary', 'testbed.outline');
      const stacked = paneSegments(paneTree.tree('primary')).at(-1);
      paneTree.closePane('primary', stacked?.id ?? '');
      expect(paneTree.tree('primary')).toEqual(PRIMARY);
      expect(localStorage.getItem(KEY)).not.toContain('primary');
    });

    it('keeps the content dock and panel docks independent', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
      paneTree.stackView('primary', 'testbed.outline');

      paneTree.unsplit(CONTENT_DOCK);
      expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
      expect(paneSegments(paneTree.tree('primary'))).toHaveLength(2);
    });
  });

  describe('focus handoff (the URL pane is switchable)', () => {
    it('hands the primary role to a secondary pane and returns its path for navigation', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');

      const focused = secondId(paneTree);
      const path = paneTree.focusPane(CONTENT_DOCK, focused, 'dashboard');
      expect(path).toBe('search');

      const root = paneTree.tree(CONTENT_DOCK) as PaneSplit;
      expect(root.second.id).toBe(focused);
      expect(root.first.id).toBe(PRIMARY_PANE);
      expect(paneTree.primaryId(CONTENT_DOCK)).toBe(focused);
      expect(leafPath(root.second as PaneLeaf)).toBe('search');
      expect(leafPath(root.first as PaneLeaf)).toBe('dashboard');
    });

    it("a handoff carries each group's tabs: the old URL group keeps its open set (R1)", () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
      paneTree.setPrimaryTabs(CONTENT_DOCK, [
        { path: 'doc/a', title: 'a.ts' },
        { path: 'doc/b' },
      ]);

      paneTree.focusPane(CONTENT_DOCK, secondId(paneTree), 'doc/a');
      const root = paneTree.tree(CONTENT_DOCK) as PaneSplit;
      const old = root.first as PaneLeaf;
      expect(old.tabs.map((t) => t.path)).toEqual(['doc/a', 'doc/b']);
      expect(old.active).toBe('doc/a');
      expect(old.tabs[0].title).toBe('a.ts');
      expect((root.second as PaneLeaf).tabs.map((t) => t.path)).toEqual([
        'search',
      ]);
    });

    it('moves no retention keys — each pane keeps what it retains under its stable id', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      const stash = TestBed.inject(RetainedViewStash);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'graph');
      const focused = secondId(paneTree);
      park(stash, 'content:main|notes', 'url-pane-surface');
      park(stash, `content:${focused}|graph`, 'other-pane-surface');

      paneTree.focusPane(CONTENT_DOCK, focused, 'notes');

      expect(stash.instancesFor(`content:${focused}`, 'graph')).toEqual([
        'other-pane-surface',
      ]);
      expect(stash.instancesFor('content:main', 'notes')).toEqual([
        'url-pane-surface',
      ]);
    });

    it('persists the pointer beside the tree and restores it on the next boot', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
      const focused = secondId(paneTree);
      paneTree.focusPane(CONTENT_DOCK, focused, 'dashboard');

      TestBed.resetTestingModule();
      const reloaded = TestBed.inject(PaneTreeService);
      expect(reloaded.primaryId(CONTENT_DOCK)).toBe(focused);
      expect((reloaded.tree(CONTENT_DOCK) as PaneSplit).second.id).toBe(
        focused,
      );
    });

    it('is a no-op for the primary pane itself, an unknown pane and a sidebar-view pane', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(
        CONTENT_DOCK,
        PRIMARY_PANE,
        'row',
        VIEW_PANE_PREFIX + 'testbed.outline',
      );
      const before = paneTree.tree(CONTENT_DOCK);

      expect(paneTree.focusPane(CONTENT_DOCK, PRIMARY_PANE, 'x')).toBeNull();
      expect(paneTree.focusPane(CONTENT_DOCK, 'nope', 'x')).toBeNull();
      expect(
        paneTree.focusPane(CONTENT_DOCK, secondId(paneTree), 'x'),
      ).toBeNull();
      expect(paneTree.tree(CONTENT_DOCK)).toEqual(before);
    });

    it('is a no-op for a pane showing home — home is not an address a pane can own', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', '');
      const before = paneTree.tree(CONTENT_DOCK);

      expect(
        paneTree.focusPane(CONTENT_DOCK, secondId(paneTree), 'x'),
      ).toBeNull();
      expect(paneTree.tree(CONTENT_DOCK)).toEqual(before);
    });

    it('keeps splits and ratios untouched across a handoff (pure role swap)', () => {
      const paneTree = TestBed.inject(PaneTreeService);
      paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
      const rootId = (paneTree.tree(CONTENT_DOCK) as PaneSplit).id;
      paneTree.resizeStream(CONTENT_DOCK, rootId, 0.3);

      paneTree.focusPane(CONTENT_DOCK, secondId(paneTree), '');
      const root = paneTree.tree(CONTENT_DOCK) as PaneSplit;
      expect(root.ratio).toBeCloseTo(0.3);
      expect(root.orientation).toBe('row');
    });
  });

  it('hydrates all docks from one snapshot (workspace apply) and persists', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    paneTree.stackView('primary', 'testbed.outline');
    const snapshot = localStorage.getItem(KEY) ?? '';

    paneTree.hydrate(undefined);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
    expect(paneSegments(paneTree.tree('primary'))).toHaveLength(1);

    paneTree.hydrate(snapshot);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    expect(paneSegments(paneTree.tree('primary')).map((s) => s.path)).toEqual([
      undefined,
      VIEW_PANE_PREFIX + 'testbed.outline',
    ]);
  });

  it('finds a tab across all docks (hasTab/sourceOf) and seeds primary tabs without stealing active (O5)', () => {
    const paneTree = TestBed.inject(PaneTreeService);
    expect(paneTree.hasTab('view:outline')).toBe(false);

    paneTree.seedPrimaryTabs('primary', ['view:nav', 'view:outline']);
    expect(paneTree.hasTab('view:outline')).toBe(true);
    expect(paneTree.sourceOf('view:outline')).toEqual({
      dock: 'primary',
      paneId: 'main',
    });

    paneTree.setActiveTab('primary', 'main', 'view:outline');
    paneTree.seedPrimaryTabs('primary', ['view:extra']);
    expect(paneTree.primaryTabs('primary').map((t) => t.path)).toEqual([
      'view:nav',
      'view:outline',
      'view:extra',
    ]);
    expect(paneTree.sourceOf('view:extra')).toEqual({
      dock: 'primary',
      paneId: 'main',
    });
  });

  it('never persists in a pop-out window', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: { location: { pathname: '/popout/view/testbed.outline' } },
        },
      ],
    });
    const paneTree = TestBed.inject(PaneTreeService);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'doc/main');

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    expect(localStorage.getItem('lw.shell.pane-trees:default')).toBeNull();
  });

});
