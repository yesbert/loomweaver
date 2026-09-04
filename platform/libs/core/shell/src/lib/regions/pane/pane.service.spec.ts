import { Component, computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { PaneChromeService } from './chrome/pane-chrome.service';
import { SurfaceCloseGuard } from './close/surface-close-guard';
import { PaneMoveService } from './drag/pane-move.service';
import { PaneActions } from './pane-actions.service';
import { PaneHandle } from './pane-handle';
import { PaneService } from './pane.service';
import { CONTENT_DOCK, PRIMARY_PANE } from './tree/pane-address';
import { PaneTreeService } from './tree/pane-tree.service';

@Component({ selector: 'lw-pane-service-stub', template: '' })
class Stub {}

class CapturingCloseGuard {
  readonly captured: unknown[][] = [];
  proceed = true;

  guarded(candidates: readonly unknown[], run: () => void): void {
    this.captured.push([...candidates]);
    if (this.proceed) {
      run();
    }
  }
}

function setUp() {
  localStorage.clear();
  const tabs = {
    closePrimaryPane: vi.fn(),
    activeTabRoot: vi.fn(() => 'search'),
    navigateTo: vi.fn(),
  };
  const moves = { moveToStrip: vi.fn() };
  const guard = new CapturingCloseGuard();
  TestBed.configureTestingModule({
    providers: [
      { provide: ContentTabsService, useValue: tabs },
      { provide: PaneMoveService, useValue: moves },
      { provide: SurfaceCloseGuard, useValue: guard },
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  registry.addContentRoute({ path: 'search', component: Stub });
  registry.addContentRoute({ path: 'doc/:id', component: Stub });
  registry.addContentRoute({ path: 'dashboard/overview', component: Stub });
  registry.addContentRoute({
    path: 'secret',
    component: Stub,
    access: { authenticated: true },
  });
  const paneTree = TestBed.inject(PaneTreeService);
  paneTree.insertTab(CONTENT_DOCK, PRIMARY_PANE, 'search');
  const panes = TestBed.inject(PaneService);
  return { panes, paneTree, tabs, moves, guard };
}

function sibling(panes: PaneService): PaneHandle {
  const found = panes.panes().find((pane) => !pane.carriesAddress);
  if (!found) {
    throw new Error('no sibling pane');
  }
  return found.handle;
}

describe('PaneService facts', () => {
  it('names one pane carrying the address before any split', () => {
    const { panes } = setUp();

    expect(panes.isSplit()).toBe(false);
    expect(panes.panes()).toEqual([
      expect.objectContaining({
        showing: 'search',
        itemCount: 1,
        carriesAddress: true,
        maximized: false,
        minimized: false,
      }),
    ]);
    expect(panes.panes()[0].handle).toBe(panes.activePane());
  });

  it('a split shows two panes, one carrying the address, and a computed follows', () => {
    const { panes } = setUp();
    const split = computed(() => panes.isSplit());
    expect(split()).toBe(false);

    panes.splitRight();

    expect(split()).toBe(true);
    const facts = panes.panes();
    expect(facts).toHaveLength(2);
    expect(facts.map((pane) => pane.showing)).toEqual(['search', 'search']);
    expect(facts.filter((pane) => pane.carriesAddress)).toHaveLength(1);
    expect(new Set(facts.map((pane) => pane.handle)).size).toBe(2);
  });
});

describe('PaneService handles', () => {
  it('keeps naming its pane when the address moves elsewhere', () => {
    const { panes, paneTree } = setUp();
    panes.splitRight();
    const other = sibling(panes);
    const before = panes.panes().find((pane) => pane.handle === other);

    paneTree.pointAt(CONTENT_DOCK, other);

    const after = panes.panes().find((pane) => pane.handle === other);
    expect(after?.showing).toBe(before?.showing);
    expect(after?.carriesAddress).toBe(true);
    expect(panes.exists(other)).toBe(true);
  });

  it('a stale handle names nothing and every action with it is a no-op', () => {
    const { panes, paneTree, guard } = setUp();
    panes.splitRight();
    const gone = sibling(panes);
    panes.closePane(gone);
    expect(panes.exists(gone)).toBe(false);
    const tree = paneTree.tree(CONTENT_DOCK);
    const asked = guard.captured.length;

    panes.splitRight(gone);
    panes.closePane(gone);
    panes.maximize(gone);
    panes.minimize(gone);
    panes.focus(gone);
    panes.moveTab('search', gone);

    expect(paneTree.tree(CONTENT_DOCK)).toBe(tree);
    expect(guard.captured).toHaveLength(asked);
    expect(panes.maximized()).toBeNull();
    expect(panes.minimized()).toEqual([]);
  });
});

describe('PaneService actions', () => {
  it('splitRight duplicates what the pane shows, like the toolbar', () => {
    const { panes, paneTree } = setUp();

    panes.splitRight();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    expect(panes.panes().map((pane) => pane.showing)).toEqual([
      'search',
      'search',
    ]);
  });

  it('splitDown splits along the other axis', () => {
    const { panes, paneTree } = setUp();

    panes.splitDown();

    const tree = paneTree.tree(CONTENT_DOCK);
    expect(tree.kind === 'split' && tree.orientation).toBe('column');
  });

  it('splits an address that carries a parameter, duplicating the item', () => {
    const { panes, paneTree } = setUp();
    paneTree.insertTab(CONTENT_DOCK, PRIMARY_PANE, 'doc/42');
    paneTree.setActiveTab(CONTENT_DOCK, PRIMARY_PANE, 'doc/42');

    panes.splitRight();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    expect(panes.panes().map((pane) => pane.showing)).toEqual([
      'doc/42',
      'doc/42',
    ]);
  });

  it('splits an address of several segments', () => {
    const { panes, paneTree } = setUp();
    paneTree.insertTab(CONTENT_DOCK, PRIMARY_PANE, 'dashboard/overview');
    paneTree.setActiveTab(CONTENT_DOCK, PRIMARY_PANE, 'dashboard/overview');

    panes.splitRight();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
  });

  it('does nothing when the user may not see what the pane shows', () => {
    const { panes, paneTree } = setUp();
    paneTree.insertTab(CONTENT_DOCK, PRIMARY_PANE, 'secret');
    paneTree.setActiveTab(CONTENT_DOCK, PRIMARY_PANE, 'secret');

    panes.splitRight();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
  });

  it('does nothing when no route answers for the address', () => {
    const { panes, paneTree } = setUp();
    paneTree.insertTab(CONTENT_DOCK, PRIMARY_PANE, 'nowhere');
    paneTree.setActiveTab(CONTENT_DOCK, PRIMARY_PANE, 'nowhere');

    panes.splitRight();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
  });

  it('closing a sibling asks the guard and removes it', () => {
    const { panes, paneTree, guard } = setUp();
    panes.splitRight();
    const other = sibling(panes);

    panes.closePane(other);

    expect(guard.captured).toHaveLength(1);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
    expect(panes.exists(other)).toBe(false);
  });

  it('a refused guard leaves the sibling in place', () => {
    const { panes, paneTree, guard } = setUp();
    panes.splitRight();
    guard.proceed = false;

    panes.closePane(sibling(panes));

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
  });

  it('closing the address pane goes through the guarded, navigating close', () => {
    const { panes, tabs } = setUp();
    panes.splitRight();

    panes.closePane();

    expect(tabs.closePrimaryPane).toHaveBeenCalledTimes(1);
  });

  it('closing the only pane does nothing and asks nothing', () => {
    const { panes, paneTree, tabs, guard } = setUp();

    panes.closePane();

    expect(tabs.closePrimaryPane).not.toHaveBeenCalled();
    expect(guard.captured).toHaveLength(0);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
  });

  it('unsplit asks the guard for the siblings and collapses to the address pane', () => {
    const { panes, paneTree, guard } = setUp();
    panes.splitRight();
    panes.splitRight();
    expect(panes.panes()).toHaveLength(3);

    panes.unsplit();

    expect(guard.captured).toHaveLength(1);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
    expect(panes.panes()[0].carriesAddress).toBe(true);
  });

  it('unsplit on a single pane is silent', () => {
    const { panes, guard } = setUp();

    panes.unsplit();

    expect(guard.captured).toHaveLength(0);
  });

  it('maximize, minimize and restore are explicit', () => {
    const { panes } = setUp();
    panes.splitRight();
    const other = sibling(panes);
    const chrome = TestBed.inject(PaneChromeService);

    panes.maximize(other);
    panes.maximize(other);
    expect(panes.maximized()).toBe(other);
    expect(chrome.isMaximized(CONTENT_DOCK, other)).toBe(true);

    panes.restore();
    expect(panes.maximized()).toBeNull();

    panes.minimize(other);
    panes.minimize(other);
    expect(panes.minimized()).toEqual([other]);

    panes.restore(other);
    expect(panes.minimized()).toEqual([]);

    panes.maximize(other);
    panes.restore(other);
    expect(panes.maximized()).toBeNull();
  });

  it('focus moves the address to the pane and navigates to what it shows', () => {
    const { panes, paneTree, tabs } = setUp();
    panes.splitRight();
    const other = sibling(panes);

    panes.focus(other);

    expect(paneTree.primaryId(CONTENT_DOCK)).toBe(other);
    expect(tabs.navigateTo).toHaveBeenCalledWith('search');
  });

  it('focusing the address pane changes nothing', () => {
    const { panes, tabs } = setUp();
    panes.splitRight();

    panes.focus(panes.activePane());

    expect(tabs.navigateTo).not.toHaveBeenCalled();
  });

  it('moveTab hands the strip drop to the move service', () => {
    const { panes, paneTree, moves } = setUp();
    panes.splitRight();
    const other = sibling(panes);
    paneTree.insertTab(CONTENT_DOCK, PRIMARY_PANE, 'doc/7');

    panes.moveTab('doc/7', other);

    expect(moves.moveToStrip).toHaveBeenCalledWith(
      { dock: CONTENT_DOCK, paneId: PRIMARY_PANE },
      'doc/7',
      { dock: CONTENT_DOCK, paneId: other },
    );
  });

  it('moveTab is a no-op for an unknown path or the tab’s own pane', () => {
    const { panes, moves } = setUp();
    panes.splitRight();

    panes.moveTab('nowhere', sibling(panes));
    panes.moveTab('search', panes.activePane());

    expect(moves.moveToStrip).not.toHaveBeenCalled();
  });
});

describe('PaneService and the rules of the surface', () => {
  it('a switched-off capability stays reachable through the service', () => {
    const { panes, paneTree } = setUp();
    TestBed.inject(FeatureSwitches).update({
      content: { splitRight: false, maximize: false },
    });

    panes.splitRight();
    panes.maximize(sibling(panes));

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    expect(panes.maximized()).toBe(sibling(panes));
  });

  it('the control and the service are one action: same tree, same guard question', () => {
    const { panes, paneTree, guard } = setUp();
    const actions = TestBed.inject(PaneActions);
    const primary = paneTree.primaryId(CONTENT_DOCK);

    actions.split(CONTENT_DOCK, primary, 'row');
    const viaControl = paneTree.tree(CONTENT_DOCK);
    paneTree.unsplit(CONTENT_DOCK);
    panes.splitRight();
    const viaService = paneTree.tree(CONTENT_DOCK);
    expect(shapeOf(viaService)).toEqual(shapeOf(viaControl));

    const other = sibling(panes);
    actions.close(CONTENT_DOCK, other);
    const askedByControl = guard.captured.at(-1);
    panes.splitRight();
    panes.closePane(sibling(panes));
    expect(guard.captured.at(-1)).toEqual(askedByControl);
  });
});

function shapeOf(node: {
  kind: string;
  orientation?: string;
  tabs?: readonly { path: string }[];
  first?: unknown;
  second?: unknown;
}): unknown {
  return node.kind === 'leaf'
    ? { kind: 'leaf', tabs: node.tabs?.map((tab) => tab.path) }
    : {
        kind: 'split',
        orientation: node.orientation,
        first: shapeOf(node.first as typeof node),
        second: shapeOf(node.second as typeof node),
      };
}
