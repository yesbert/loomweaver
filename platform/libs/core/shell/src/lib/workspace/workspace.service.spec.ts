import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { WorkspaceService } from './workspace.service';
import { BootAddress } from '../regions/content/routing/boot-address';
import {
  ActiveWorkspaceService,
  DEFAULT_WORKSPACE_ID,
} from './active-workspace.service';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { PRIMARY_PANE, VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';
import { paneSegments } from '../regions/pane/tree/pane-queries';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { findLeaf } from '../regions/pane/tree/pane-queries';
import { provideLayout } from '../layout/layout';
import { provideWorkspaces } from './provide-workspaces';
import { HiddenViewsService } from '../regions/panel/hidden-views.service';
import { PanelGroupService } from '../regions/panel/panel-group.service';
import { PanelState } from '../regions/panel/panel-state';

@Component({ selector: 'lw-test-view', template: '' })
class TestView {}

const KEY = 'lw.shell.workspaces';

function scoped(base: string, workspaceId: string): string {
  return `${base}:${workspaceId}`;
}

describe('WorkspaceService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }])],
    });
  });

  it('saves against a peek-less store that rejects instead of leaving an unhandled rejection', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: SETTINGS_STORE,
          useValue: {
            get: () => Promise.reject(new Error('401')),
            set: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          },
        },
      ],
    });
    const ws = TestBed.inject(WorkspaceService);

    await expect(ws.saveCurrent('A')).resolves.toBeUndefined();
    expect(ws.workspaces().map((w) => w.name)).toEqual(['A']);
  });

  it('starts in the default workspace with no saved workspaces', () => {
    const ws = TestBed.inject(WorkspaceService);
    expect(ws.workspaces()).toEqual([]);
    expect(ws.activeId()).toBe(DEFAULT_WORKSPACE_ID);
  });

  it('save-as makes the new workspace active and keeps the arrangement as its baseline', async () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    await ws.saveCurrent('A');

    const saved = ws.workspaces()[0];
    expect(ws.activeId()).toBe(saved.id);
    expect(saved.baseline['lw.shell.pane-trees']).toContain('search');
    expect(localStorage.getItem(KEY)).toContain('A');
    expect(
      localStorage.getItem(scoped('lw.shell.pane-trees', saved.id)),
    ).toContain('search');
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
  });

  it('switching remembers each workspace’s own working state (round trip)', async () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    await ws.saveCurrent('A');
    const id = ws.workspaces()[0].id;

    paneTree.unsplit(CONTENT_DOCK);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);

    await ws.switchTo(DEFAULT_WORKSPACE_ID);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);

    await ws.switchTo(id);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
  });

  it('a fresh switch target without working state applies its baseline', async () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    await ws.saveCurrent('A');
    const id = ws.workspaces()[0].id;
    localStorage.removeItem(scoped('lw.shell.pane-trees', id));

    await ws.switchTo(DEFAULT_WORKSPACE_ID);
    paneTree.unsplit(CONTENT_DOCK);

    await ws.switchTo(id);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
  });

  it('reset discards the working state and applies the active workspace’s baseline', async () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    paneTree.stackView('primary', 'testbed.outline');
    await ws.saveCurrent('A');

    paneTree.unsplit(CONTENT_DOCK);
    const paneId = paneSegments(paneTree.tree('primary')).at(-1)?.id ?? '';
    paneTree.closePane('primary', paneId);

    ws.reset();
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    expect(paneSegments(paneTree.tree('primary')).map((s) => s.path)).toEqual([
      undefined,
      VIEW_PANE_PREFIX + 'testbed.outline',
    ]);
  });

  it('reset in the default workspace restores factory defaults and keeps saved workspaces', async () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    await ws.saveCurrent('keep-me');
    await ws.switchTo(DEFAULT_WORKSPACE_ID);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);

    ws.reset();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
    expect(ws.workspaces().map((w) => w.name)).toEqual(['keep-me']);
  });

  it('removing the active workspace falls back to the default and deletes its working state', async () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    await ws.saveCurrent('A');
    const id = ws.workspaces()[0].id;
    expect(
      localStorage.getItem(scoped('lw.shell.pane-trees', id)),
    ).not.toBeNull();

    ws.remove(id);

    expect(ws.workspaces()).toEqual([]);
    expect(ws.activeId()).toBe(DEFAULT_WORKSPACE_ID);
    expect(localStorage.getItem(scoped('lw.shell.pane-trees', id))).toBeNull();
  });

  it('hasChanges tracks the working state against the active workspace’s baseline', async () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);
    expect(ws.hasChanges()).toBe(false);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    expect(ws.hasChanges()).toBe(true);

    await ws.saveCurrent('A');
    expect(ws.hasChanges()).toBe(false);

    paneTree.unsplit(CONTENT_DOCK);
    expect(ws.hasChanges()).toBe(true);

    await ws.saveBaseline();
    expect(ws.hasChanges()).toBe(false);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    ws.reset();
    expect(ws.hasChanges()).toBe(false);
  });

  it('changedIds marks a workspace left with unapplied changes, active or not', async () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    await ws.saveCurrent('A');
    const id = ws.workspaces()[0].id;
    expect(ws.changedIds().has(id)).toBe(false);

    paneTree.unsplit(CONTENT_DOCK);
    expect(ws.changedIds().has(id)).toBe(true);

    await ws.switchTo(DEFAULT_WORKSPACE_ID);
    expect(ws.changedIds().has(id)).toBe(true);
    expect(ws.changedIds().has(DEFAULT_WORKSPACE_ID)).toBe(true);
  });

  it('seeded sidebar docks do not count as changes — the default workspace boots clean', () => {
    const registry = TestBed.inject(ContributionRegistry);
    registry.addView({
      id: 'nav',
      region: 'primary',
      title: 'n',
      component: TestView,
    });
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'o',
      component: TestView,
    });
    const groups = TestBed.inject(PanelGroupService);
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);

    groups.seed('primary');
    expect(paneTree.primaryTabs('primary').length).toBe(2);
    expect(ws.hasChanges()).toBe(false);
    expect(ws.changedIds().size).toBe(0);

    paneTree.setActiveTab('primary', PRIMARY_PANE, 'view:outline');
    expect(ws.hasChanges()).toBe(true);

    paneTree.setActiveTab('primary', PRIMARY_PANE, 'view:nav');
    expect(ws.hasChanges()).toBe(false);
  });

  it('reset clears hasChanges and navigates to the baseline’s active content', async () => {
    const registry = TestBed.inject(ContributionRegistry);
    registry.addView({
      id: 'nav',
      region: 'primary',
      title: 'n',
      component: TestView,
    });
    const groups = TestBed.inject(PanelGroupService);
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);
    groups.seed('primary');

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'search');
    expect(ws.hasChanges()).toBe(true);

    ws.reset();
    expect(ws.hasChanges()).toBe(false);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
  });

  it('hiding a view flags the workspace as changed; revealing it reads clean again', () => {
    const registry = TestBed.inject(ContributionRegistry);
    registry.addView({
      id: 'nav',
      region: 'primary',
      title: 'n',
      component: TestView,
    });
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'o',
      component: TestView,
    });
    const groups = TestBed.inject(PanelGroupService);
    const hidden = TestBed.inject(HiddenViewsService);
    const paneTree = TestBed.inject(PaneTreeService);
    const ws = TestBed.inject(WorkspaceService);
    groups.seed('primary');
    expect(ws.hasChanges()).toBe(false);

    hidden.hide('outline');
    groups.seed('primary');
    expect(ws.hasChanges()).toBe(true);

    hidden.show('outline');
    groups.seed('primary');
    expect(paneTree.primaryTabs('primary').map((tab) => tab.path)).toEqual([
      'view:nav',
      'view:outline',
    ]);
    expect(ws.hasChanges()).toBe(false);
  });

  it('a baseline with a hidden view reads clean and reset restores the hidden set', async () => {
    const registry = TestBed.inject(ContributionRegistry);
    registry.addView({
      id: 'nav',
      region: 'primary',
      title: 'n',
      component: TestView,
    });
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'o',
      component: TestView,
    });
    const groups = TestBed.inject(PanelGroupService);
    const hidden = TestBed.inject(HiddenViewsService);
    const ws = TestBed.inject(WorkspaceService);
    groups.seed('primary');

    hidden.hide('outline');
    groups.seed('primary');
    await ws.saveCurrent('focus');
    const focusId = ws.workspaces()[0].id;
    expect(ws.hasChanges()).toBe(false);

    hidden.show('outline');
    groups.seed('primary');
    expect(ws.hasChanges()).toBe(true);

    ws.reset();
    expect(hidden.isHidden('outline')).toBe(true);
    expect(ws.hasChanges()).toBe(false);

    await ws.switchTo(DEFAULT_WORKSPACE_ID);
    hidden.show('outline');
    groups.seed('primary');
    expect(hidden.isHidden('outline')).toBe(false);

    await ws.switchTo(focusId);
    expect(hidden.isHidden('outline')).toBe(true);
  });

  it('collapsing a sidebar is no workspace change — the frame belongs to the window', () => {
    const panels = TestBed.inject(PanelState);
    const ws = TestBed.inject(WorkspaceService);

    panels.toggle('primary');

    expect(ws.hasChanges()).toBe(false);
  });

  it('renames a workspace', async () => {
    const ws = TestBed.inject(WorkspaceService);
    await ws.saveCurrent('A');

    ws.rename(ws.workspaces()[0].id, 'renamed');
    expect(ws.workspaces()[0].name).toBe('renamed');
  });

  it('restores persisted workspaces via peek and drops entries without a baseline', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 'x', name: 'Saved', baseline: {} },
        { id: 'y', name: 'Old snapshot shape', snapshot: {} },
      ]),
    );
    expect(TestBed.inject(WorkspaceService).workspaces()).toEqual([
      { id: 'x', name: 'Saved', baseline: {} },
    ]);
  });

  it('ignores a corrupted payload', () => {
    localStorage.setItem(KEY, '{not json');
    expect(TestBed.inject(WorkspaceService).workspaces()).toEqual([]);
  });
});

describe('WorkspaceService with developer definitions', () => {
  const DEFINITION = {
    id: 'dev.review',
    title: 'k.review',
    sidebars: { primary: ['nav'] },
    content: {
      columns: [
        { size: 30, tabs: [{ path: 'doc', closable: false }] },
        { tabs: ['search'] },
      ],
    },
  } as const;

  let ws: WorkspaceService;
  let paneTree: PaneTreeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideWorkspaces(DEFINITION),
        provideLayout({
          regions: [
            { id: 'primary', type: 'panel', dock: 'left' },
            { id: 'secondary', type: 'panel', dock: 'right' },
            { id: 'main', type: 'content', dock: 'center' },
          ],
        }),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({
      path: 'doc',
      title: 'k.doc',
      component: TestView,
    });
    registry.addContentRoute({ path: 'search', component: TestView });
    registry.addView({
      id: 'nav',
      region: 'primary',
      title: 'nav',
      component: TestView,
    });
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'outline',
      component: TestView,
    });
    ws = TestBed.inject(WorkspaceService);
    paneTree = TestBed.inject(PaneTreeService);
  });

  it('lists the definition and switching applies its declared arrangement cleanly', async () => {
    expect(ws.definitions.map((definition) => definition.id)).toEqual([
      'dev.review',
    ]);

    await ws.switchTo('dev.review');

    expect(ws.activeId()).toBe('dev.review');
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    const primary = findLeaf(paneTree.tree(CONTENT_DOCK), PRIMARY_PANE);
    expect(primary?.tabs).toEqual([{ path: 'doc', closable: false }]);
    expect(TestBed.inject(HiddenViewsService).isHidden('outline')).toBe(true);
    expect(ws.hasChanges()).toBe(false);
  });

  it('reset returns to the declaration after the user rearranged', async () => {
    await ws.switchTo('dev.review');
    paneTree.unsplit(CONTENT_DOCK);
    expect(ws.hasChanges()).toBe(true);

    ws.reset();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    expect(ws.hasChanges()).toBe(false);
  });

  it('a definition can neither be renamed, removed nor baseline-overwritten', async () => {
    await ws.switchTo('dev.review');
    paneTree.unsplit(CONTENT_DOCK);

    await ws.saveBaseline();
    expect(ws.hasChanges()).toBe(true);

    ws.rename('dev.review', 'other');
    ws.remove('dev.review');
    expect(ws.definitions[0].title).toBe('k.review');
    expect(ws.activeId()).toBe('dev.review');
    expect(ws.workspaces()).toEqual([]);
  });

  it('a never-visited definition carries no change marker', () => {
    expect(ws.changedIds().has('dev.review')).toBe(false);
  });

  it('marks a non-active definition whose stored working state differs', () => {
    localStorage.setItem(
      scoped('lw.shell.pane-trees', 'dev.review'),
      JSON.stringify({
        content: { kind: 'leaf', id: PRIMARY_PANE, tabs: [{ path: 'search' }] },
      }),
    );

    expect(ws.changedIds().has('dev.review')).toBe(true);
  });
});

describe('WorkspaceService ignores refined tab labels in the change comparison', () => {
  it('a mount-refined title never flags the workspace as changed', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideWorkspaces({
          id: 'dev.plain',
          title: 'k.plain',
          content: { tabs: ['doc'] },
        }),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({
      path: 'doc',
      title: 'k.doc',
      component: TestView,
    });
    const ws = TestBed.inject(WorkspaceService);
    const paneTree = TestBed.inject(PaneTreeService);

    await ws.switchTo('dev.plain');
    expect(ws.hasChanges()).toBe(false);

    paneTree.setPrimaryTabs(
      CONTENT_DOCK,
      paneTree
        .primaryTabs(CONTENT_DOCK)
        .map((tab) => ({ ...tab, title: 'E-01', literalTitle: true })),
    );
    expect(ws.hasChanges()).toBe(false);

    paneTree.splitPane(CONTENT_DOCK, PRIMARY_PANE, 'row', 'doc');
    expect(ws.hasChanges()).toBe(true);
  });
});

describe('WorkspaceService adopting the declared initial workspace', () => {
  const DEFINITION = {
    id: 'dev.start',
    title: 'k.start',
    initial: true,
    content: { tabs: [{ path: 'doc', closable: false }] },
  } as const;

  function compose(): void {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'doc', children: [] },
          { path: 'search', children: [] },
          { path: '**', children: [] },
        ]),
        provideWorkspaces(DEFINITION),
        provideLayout({
          regions: [{ id: 'main', type: 'content', dock: 'center' }],
        }),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({ path: 'doc', component: TestView });
    registry.addContentRoute({ path: 'search', component: TestView });
  }

  async function settle(): Promise<void> {
    await TestBed.inject(ActiveWorkspaceService).ready;
    for (let tick = 0; tick < 4; tick += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  it('shows the declared content when the boot address named nothing', async () => {
    compose();
    TestBed.inject(WorkspaceService);

    await settle();

    expect(TestBed.inject(Router).url).toBe('/doc');
  });

  it('leaves a boot address that names content alone', async () => {
    compose();
    await TestBed.inject(Router).navigateByUrl('/search');
    TestBed.inject(WorkspaceService);

    await settle();

    expect(TestBed.inject(Router).url).toBe('/search');
  });

  it('leaves a boot address that names content alone while the router is still on its way there', async () => {
    compose();
    TestBed.inject(Location).go('/search');
    TestBed.inject(BootAddress);
    TestBed.inject(WorkspaceService);

    await settle();

    expect(TestBed.inject(Router).url).toBe('/');
  });
});

describe('WorkspaceService and the screens a workspace cannot hold', () => {
  function compose(definition: unknown): void {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', children: [] },
          { path: '**', children: [] },
        ]),
        provideWorkspaces(definition as never),
        provideLayout({
          regions: [{ id: 'main', type: 'content', dock: 'center' }],
        }),
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    registry.addContentRoute({
      path: 'login',
      chromeless: true,
      component: TestView,
    });
  }

  it('tells the developer when a definition names a full-area screen as a tab', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    compose({
      id: 'dev.login',
      title: 'k.login',
      content: { tabs: [{ path: 'login' }] },
    });

    await TestBed.inject(WorkspaceService).switchTo('dev.login');

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('never renders as a tab'),
    );
    warn.mockRestore();
  });

  it('leaves the content at the bare address for a definition with no arrangement', async () => {
    compose({ id: 'dev.overview', title: 'k.overview' });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/login');

    await TestBed.inject(WorkspaceService).switchTo('dev.overview');
    for (let tick = 0; tick < 4; tick += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    expect(router.url).toBe('/');
  });
});
