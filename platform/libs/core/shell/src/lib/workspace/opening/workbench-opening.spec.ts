import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { WorkspaceService } from '../workspace.service';
import { BootAddress } from '../../regions/content/routing/boot-address';
import { ActiveWorkspaceService } from '../active-workspace.service';
import { BUILT_IN_WORKSPACE_ID } from '../declaration/composed-definitions';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { provideLayout } from '../../layout/layout';
import { provideWorkspaces } from '../declaration/provide-workspaces';
import { CONTENT_DOCK } from '../../regions/pane/tree/pane-address';
import { collectTabPaths } from '../../regions/pane/tree/pane-queries';
import { PaneTreeService } from '../../regions/pane/tree/pane-tree.service';

@Component({ selector: 'lw-test-view', template: '' })
class TestView {}

function arrangedTabs(): string[] {
  return collectTabPaths(TestBed.inject(PaneTreeService).tree(CONTENT_DOCK));
}

function scoped(base: string, workspaceId: string): string {
  return `${base}:${workspaceId}`;
}

describe('WorkspaceService adopting the declared initial workspace', () => {
  const DEFINITION = {
    id: 'dev.start',
    title: 'k.start',
    initial: true,
    content: { tabs: [{ path: 'doc', closable: false }] },
  } as const;

  function compose(
    storedActive?: string,
    options: { saved?: readonly unknown[]; declared?: boolean } = {},
  ): void {
    localStorage.clear();
    if (storedActive !== undefined) {
      localStorage.setItem('lw.shell.active-workspace', storedActive);
    }
    if (options.saved !== undefined) {
      localStorage.setItem(
        'lw.shell.workspaces',
        JSON.stringify(options.saved),
      );
    }
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'doc', children: [] },
          { path: 'search', children: [] },
          { path: '**', children: [] },
        ]),
        ...(options.declared === false ? [] : [provideWorkspaces(DEFINITION)]),
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

  it('moves the user to the declared initial when the saved workspace they are in is removed', async () => {
    compose();
    const ws = TestBed.inject(WorkspaceService);
    await settle();
    await ws.saveCurrent('Mine');
    const [saved] = ws.workspaces();
    expect(ws.activeId()).toBe(saved.id);

    await ws.remove(saved.id);
    await settle();

    expect(ws.activeId()).toBe('dev.start');
  });

  it('opens a stored choice of the built-in workspace in the declared initial from its baseline, at a deep link too', async () => {
    compose(BUILT_IN_WORKSPACE_ID);
    await TestBed.inject(Router).navigateByUrl('/search');
    const ws = TestBed.inject(WorkspaceService);

    await settle();

    expect(ws.activeId()).toBe('dev.start');
    expect(arrangedTabs()).toContain('doc');
    expect(arrangedTabs()).toContain('search');
    expect(TestBed.inject(Router).url).toBe('/search');
  });

  it('opens a stored choice of the built-in workspace in the declared initial and shows its content where the address named nothing', async () => {
    compose(BUILT_IN_WORKSPACE_ID);
    const ws = TestBed.inject(WorkspaceService);

    await settle();

    expect(ws.activeId()).toBe('dev.start');
    expect(arrangedTabs()).toEqual(['doc']);
    expect(TestBed.inject(Router).url).toBe('/doc');
  });

  it('gives a stored workspace that nothing lists any more up for the declared initial, keeping the address', async () => {
    compose('gone');
    await TestBed.inject(Router).navigateByUrl('/search');
    const ws = TestBed.inject(WorkspaceService);

    await settle();

    expect(ws.activeId()).toBe('dev.start');
    expect(localStorage.getItem('lw.shell.active-workspace')).toBe('dev.start');
    expect(arrangedTabs()).toContain('doc');
    expect(arrangedTabs()).toContain('search');
    expect(TestBed.inject(Router).url).toBe('/search');
  });

  it('shows the declared content after giving a stored workspace up where the address named nothing', async () => {
    compose('gone');
    const ws = TestBed.inject(WorkspaceService);

    await settle();

    expect(ws.activeId()).toBe('dev.start');
    expect(TestBed.inject(Router).url).toBe('/doc');
  });

  it('gives a stored workspace that nothing lists any more up for the built-in one where nothing is declared', async () => {
    compose('gone', { declared: false });
    await TestBed.inject(Router).navigateByUrl('/search');
    const ws = TestBed.inject(WorkspaceService);

    await settle();

    expect(ws.activeId()).toBe(BUILT_IN_WORKSPACE_ID);
    expect(localStorage.getItem('lw.shell.active-workspace')).toBe(
      BUILT_IN_WORKSPACE_ID,
    );
    expect(TestBed.inject(Router).url).toBe('/search');
  });

  it('leaves the user in a stored workspace they saved', async () => {
    compose('mine', { saved: [{ id: 'mine', name: 'Mine', baseline: {} }] });
    await TestBed.inject(Router).navigateByUrl('/search');
    const ws = TestBed.inject(WorkspaceService);

    await settle();

    expect(ws.activeId()).toBe('mine');
    expect(TestBed.inject(Router).url).toBe('/search');
  });

  it('knows no built-in workspace beside the declared initial', async () => {
    compose();
    const ws = TestBed.inject(WorkspaceService);
    await settle();
    await ws.saveCurrent('Mine');
    const [saved] = ws.workspaces();

    await ws.switchTo(BUILT_IN_WORKSPACE_ID);
    await ws.resetAll();

    expect(ws.activeId()).toBe(saved.id);
    expect(
      localStorage.getItem(
        scoped('lw.shell.pane-trees', BUILT_IN_WORKSPACE_ID),
      ),
    ).toBeNull();
  });
});
