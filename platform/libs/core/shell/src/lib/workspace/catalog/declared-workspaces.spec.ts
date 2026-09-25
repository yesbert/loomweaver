import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { WorkspaceService } from '../workspace.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { PRIMARY_PANE } from '../../regions/pane/tree/pane-address';
import { CONTENT_DOCK } from '../../regions/pane/tree/pane-address';
import { PaneTreeService } from '../../regions/pane/tree/pane-tree.service';
import { findLeaf } from '../../regions/pane/tree/pane-queries';
import { provideLayout } from '../../layout/layout';
import { provideWorkspaces } from '../declaration/provide-workspaces';
import { HiddenViewsService } from '../../regions/panel/hidden-views.service';

@Component({ selector: 'lw-test-view', template: '' })
class TestView {}

function scoped(base: string, workspaceId: string): string {
  return `${base}:${workspaceId}`;
}

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

    await ws.reset();

    expect(paneTree.isSplit(CONTENT_DOCK)).toBe(true);
    expect(ws.hasChanges()).toBe(false);
  });

  it('a definition can neither be renamed, removed nor baseline-overwritten', async () => {
    await ws.switchTo('dev.review');
    paneTree.unsplit(CONTENT_DOCK);

    await ws.saveBaseline();
    expect(ws.hasChanges()).toBe(true);

    ws.rename('dev.review', 'other');
    await ws.remove('dev.review');
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
