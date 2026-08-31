import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { provideLayout } from '../layout/layout';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { collectTabs } from '../regions/pane/tree/pane-queries';
import { buildContentRoutes } from '../regions/content/routing/content-router';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { WORKSPACE_CLAIMS } from '../foundation/workspace-claims';
import { WorkspaceService } from './workspace.service';
import { provideWorkspaces } from './provide-workspaces';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'quotes/:id', component: TestContent, id: 'quotes.document' },
  { path: 'payments', component: TestContent },
];

const LAYOUT = {
  regions: [
    { id: 'main', type: 'content', dock: 'center' },
    { id: 'left-panel', type: 'panel', dock: 'left' },
  ],
} as const;

let harness: RouterTestingHarness;

interface Composed {
  readonly workspaces: WorkspaceService;
  readonly tabs: ContentTabsService;
  readonly panes: PaneTreeService;
}

async function compose(): Promise<Composed> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(buildContentRoutes(ROUTES)),
      provideLayout(LAYOUT as never),
      { provide: WORKSPACE_CLAIMS, useExisting: WorkspaceService },
      provideWorkspaces(
        { id: 'overview', title: 'Overview', initial: true, claims: [''] },
        { id: 'quotes', title: 'Quotes', claims: ['quotes/:id'] },
      ),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  harness = await RouterTestingHarness.create();
  return {
    workspaces: TestBed.inject(WorkspaceService),
    tabs: TestBed.inject(ContentTabsService),
    panes: TestBed.inject(PaneTreeService),
  };
}

async function settled(): Promise<void> {
  await TestBed.inject(ApplicationRef).whenStable();
}

function seedOverviewDock(path: string): void {
  localStorage.setItem('lw.shell.active-workspace', 'overview');
  localStorage.setItem(
    'lw.shell.pane-trees:overview',
    JSON.stringify({
      content: {
        tree: {
          kind: 'leaf',
          id: 'main',
          tabs: [{ path, title: path }],
          active: path,
        },
        primary: 'main',
      },
    }),
  );
}

function seedSavedWorkspace(id: string, origin: string, path: string): void {
  localStorage.setItem('lw.shell.active-workspace', id);
  localStorage.setItem(
    'lw.shell.workspaces',
    JSON.stringify([{ id, name: 'Saved', baseline: {}, origin }]),
  );
  localStorage.setItem(
    `lw.shell.pane-trees:${id}`,
    JSON.stringify({
      content: {
        tree: {
          kind: 'leaf',
          id: 'main',
          tabs: [{ path, title: path }],
          active: path,
        },
        primary: 'main',
      },
    }),
  );
}

function contentPaths(panes: PaneTreeService): readonly string[] {
  return collectTabs(panes.tree(CONTENT_DOCK)).map((tab) => tab.path);
}

describe('opening content at an address another workspace claims', () => {
  beforeEach(() => localStorage.clear());

  it('leaves no tab behind in the workspace the open was made from', async () => {
    const { workspaces, tabs, panes } = await compose();
    expect(workspaces.activeId()).toBe('overview');

    tabs.open({ path: 'quotes/q-0007', title: 'Q-0007', titleIsLiteral: true });
    await settled();

    expect(workspaces.activeId()).toBe('quotes');

    await workspaces.switchTo('overview');
    await settled();
    expect(contentPaths(panes)).not.toContain('quotes/q-0007');
  });

  it('does not write the tab under the workspace the open was made from', async () => {
    const { tabs } = await compose();

    tabs.open({ path: 'quotes/q-0007', title: 'Q-0007', titleIsLiteral: true });
    await settled();

    const stored = localStorage.getItem('lw.shell.pane-trees:overview') ?? '';
    expect(stored).not.toContain('quotes/q-0007');
  });

  it('drops a stored tab another workspace claims when the arrangement loads', async () => {
    seedOverviewDock('quotes/q-0007');

    const { workspaces, panes } = await compose();
    await settled();

    expect(workspaces.activeId()).toBe('overview');
    expect(contentPaths(panes)).not.toContain('quotes/q-0007');
  });

  it('leaves no empty dock behind where every stored tab was dropped', async () => {
    seedOverviewDock('quotes/q-0007');

    const { panes } = await compose();
    await settled();

    expect(Object.keys(panes.dockTrees())).not.toContain('content');
  });

  it('restores a stored tab no workspace claims', async () => {
    seedOverviewDock('payments');

    const { panes } = await compose();
    await settled();

    expect(contentPaths(panes)).toContain('payments');
  });

  it('keeps content a saved copy inherited the claim for', async () => {
    seedSavedWorkspace('ws-month-end', 'quotes', 'quotes/q-0007');

    const { panes } = await compose();
    await settled();

    expect(contentPaths(panes)).toContain('quotes/q-0007');
  });

  it('drops foreign content from a saved copy too', async () => {
    seedSavedWorkspace('ws-my-overview', 'overview', 'quotes/q-0007');

    const { panes } = await compose();
    await settled();

    expect(contentPaths(panes)).not.toContain('quotes/q-0007');
  });

  it('keeps two opens in the order they were made', async () => {
    const { workspaces, tabs, panes } = await compose();

    tabs.open({ path: 'quotes/q-0001', title: 'Q-0001', titleIsLiteral: true });
    tabs.open({ path: 'quotes/q-0002', title: 'Q-0002', titleIsLiteral: true });
    await settled();

    expect(workspaces.activeId()).toBe('quotes');
    const paths = contentPaths(panes).filter((path) =>
      path.startsWith('quotes/'),
    );
    expect(paths).toEqual(['quotes/q-0001', 'quotes/q-0002']);
    expect(tabs.activePath()).toBe('quotes/q-0002');
  });

  it('still settles an address that arrives through the router', async () => {
    const { workspaces } = await compose();
    expect(workspaces.activeId()).toBe('overview');

    await harness.navigateByUrl('/quotes/q-0007');
    await settled();

    expect(workspaces.activeId()).toBe('quotes');
  });

  it('keeps an address nothing claims where the user already is', async () => {
    const { workspaces, tabs, panes } = await compose();

    tabs.open({ path: 'payments', title: 'Payments' });
    await settled();

    expect(workspaces.activeId()).toBe('overview');
    expect(contentPaths(panes)).toContain('payments');
  });
});
