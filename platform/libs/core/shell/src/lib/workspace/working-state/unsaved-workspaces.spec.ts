import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkspaceService } from '../workspace.service';
import { BUILT_IN_WORKSPACE_ID } from '../declaration/composed-definitions';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { PRIMARY_PANE } from '../../regions/pane/tree/pane-address';
import { CONTENT_DOCK } from '../../regions/pane/tree/pane-address';
import { PaneTreeService } from '../../regions/pane/tree/pane-tree.service';
import { provideWorkspaces } from '../declaration/provide-workspaces';
import { HiddenViewsService } from '../../regions/panel/hidden-views.service';
import { PanelGroupService } from '../../regions/panel/panel-group.service';
import { PanelState } from '../../regions/panel/panel-state';

@Component({ selector: 'lw-test-view', template: '' })
class TestView {}

describe('WorkspaceService tracking unsaved changes', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }])],
    });
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
    await ws.reset();
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

    await ws.switchTo(BUILT_IN_WORKSPACE_ID);
    expect(ws.changedIds().has(id)).toBe(true);
    expect(ws.changedIds().has(BUILT_IN_WORKSPACE_ID)).toBe(true);
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

    await ws.reset();
    expect(hidden.isHidden('outline')).toBe(true);
    expect(ws.hasChanges()).toBe(false);

    await ws.switchTo(BUILT_IN_WORKSPACE_ID);
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
