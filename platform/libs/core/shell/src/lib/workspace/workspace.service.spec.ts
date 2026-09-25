import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkspaceService } from './workspace.service';
import { BUILT_IN_WORKSPACE_ID } from './declaration/composed-definitions';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { PRIMARY_PANE, VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';
import { paneSegments } from '../regions/pane/tree/pane-queries';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { PanelGroupService } from '../regions/panel/panel-group.service';

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
    expect(ws.activeId()).toBe(BUILT_IN_WORKSPACE_ID);
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

    await ws.switchTo(BUILT_IN_WORKSPACE_ID);
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

    await ws.switchTo(BUILT_IN_WORKSPACE_ID);
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

    await ws.reset();
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
    await ws.switchTo(BUILT_IN_WORKSPACE_ID);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);

    await ws.reset();

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

    await ws.remove(id);

    expect(ws.workspaces()).toEqual([]);
    expect(ws.activeId()).toBe(BUILT_IN_WORKSPACE_ID);
    expect(localStorage.getItem(scoped('lw.shell.pane-trees', id))).toBeNull();
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

    await ws.reset();
    expect(ws.hasChanges()).toBe(false);
    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(false);
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

