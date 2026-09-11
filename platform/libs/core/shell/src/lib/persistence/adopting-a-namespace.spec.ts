import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Translation, TranslocoLoader, provideTransloco } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { provideLayout } from '../layout/layout';
import { provideIdentityScopedStores } from './identity-scoped-stores';
import { buildContentRoutes } from '../regions/content/routing/content-router';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { collectLeafIds } from '../regions/pane/tree/pane-queries';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { WORKING_STATE_STORE } from './working-state-store';
import { WORKSPACE_CLAIMS } from '../foundation/workspace-claims';
import { WorkspaceService } from '../workspace/workspace.service';
import { provideWorkspaces } from '../workspace/provide-workspaces';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

class EmptyBundles implements TranslocoLoader {
  getTranslation(): Observable<Translation> {
    return of({});
  }
}

const ROUTES: readonly ContentRoute[] = [
  { path: 'dashboard', component: TestContent },
  { path: 'knowledge-base', component: TestContent },
  {
    path: 'arranged/:id',
    container: {
      children: ['canvas', 'details', 'audit'],
      initial: {
        columns: [
          { size: 60, tabs: ['canvas'] },
          { size: 40, rows: [{ tabs: ['details'] }, { tabs: ['audit'] }] },
        ],
      },
    },
  },
];

const CONTAINER_DOCK = 'container@arranged/alpha';

const LAYOUT = {
  regions: [{ id: 'main', type: 'content', dock: 'center' }],
} as const;

const SPLIT_ARRANGEMENT = JSON.stringify({
  content: {
    tree: {
      kind: 'split',
      id: 'root',
      orientation: 'row',
      ratio: 0.5,
      first: {
        kind: 'leaf',
        id: 'main',
        tabs: [{ path: 'dashboard' }],
        active: 'dashboard',
      },
      second: {
        kind: 'leaf',
        id: 'right',
        tabs: [{ path: 'knowledge-base' }],
        active: 'knowledge-base',
      },
    },
    primary: 'main',
  },
});

let identity: string | null = null;

async function settled(): Promise<void> {
  await TestBed.inject(ApplicationRef).whenStable();
  for (let turn = 0; turn < 5; turn += 1) {
    await Promise.resolve();
  }
  await TestBed.inject(ApplicationRef).whenStable();
}

async function open(at = '/dashboard'): Promise<{
  workspaces: WorkspaceService;
  panes: PaneTreeService;
}> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(buildContentRoutes(ROUTES)),
      provideTransloco({
        config: { availableLangs: ['en'], defaultLang: 'en' },
        loader: EmptyBundles,
      }),
      provideLayout(LAYOUT as never),
      provideIdentityScopedStores({ identity: () => identity }),
      { provide: WORKSPACE_CLAIMS, useExisting: WorkspaceService },
      provideWorkspaces({
        id: 'dashboard',
        title: 'Dashboard',
        initial: true,
        claims: ['dashboard'],
        content: { tabs: [{ path: 'dashboard', closable: false }] },
      }),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  await RouterTestingHarness.create(at);
  const workspaces = TestBed.inject(WorkspaceService);
  const panes = TestBed.inject(PaneTreeService);
  await settled();
  return { workspaces, panes };
}

async function signIn(id: string): Promise<void> {
  identity = id;
  await TestBed.inject(WORKING_STATE_STORE).get('lw.shell.active-workspace');
  await settled();
}

function containerPanes(panes: PaneTreeService): readonly string[] {
  return collectLeafIds(panes.tree(CONTAINER_DOCK));
}

function storedArrangement(): string | undefined {
  return (
    localStorage.getItem('lw.id.ada:lw.shell.pane-trees:dashboard') ?? undefined
  );
}

describe('a session that arrives after the workbench has already read', () => {
  beforeEach(() => {
    localStorage.clear();
    identity = null;
  });

  it('keeps the arrangement stored for the person who signs in', async () => {
    localStorage.setItem('lw.id.ada:lw.shell.active-workspace', 'dashboard');
    localStorage.setItem(
      'lw.id.ada:lw.shell.pane-trees:dashboard',
      SPLIT_ARRANGEMENT,
    );
    const { panes } = await open();
    expect(panes.isSplit(CONTENT_DOCK)).toBe(false);

    identity = 'ada';
    panes.unsplit(CONTENT_DOCK);
    await settled();

    expect(panes.isSplit(CONTENT_DOCK)).toBe(true);
    expect(storedArrangement()).toBe(SPLIT_ARRANGEMENT);
  });

  it('keeps what was built for a person the product has never seen', async () => {
    const { panes } = await open();

    identity = 'ada';
    panes.unsplit(CONTENT_DOCK);
    await settled();

    expect(panes.primaryTabs(CONTENT_DOCK).map((tab) => tab.path)).toEqual([
      'dashboard',
    ]);
    expect(storedArrangement()).toContain('dashboard');
  });

  it('keeps a container arrangement the adopted namespace holds nothing for', async () => {
    const { panes } = await open();
    await TestBed.inject(Router).navigateByUrl('/arranged/alpha');
    await settled();
    expect(containerPanes(panes)).toHaveLength(3);

    await signIn('ada');

    expect(containerPanes(panes)).toHaveLength(3);
  });

  it('reads once where the identity is known before the first read', async () => {
    identity = 'ada';
    localStorage.setItem('lw.id.ada:lw.shell.active-workspace', 'dashboard');
    localStorage.setItem(
      'lw.id.ada:lw.shell.pane-trees:dashboard',
      SPLIT_ARRANGEMENT,
    );

    const { panes } = await open();

    expect(panes.isSplit(CONTENT_DOCK)).toBe(true);
    expect(storedArrangement()).toBe(SPLIT_ARRANGEMENT);
  });
});
