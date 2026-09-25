import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { BootAddress } from '../regions/content/routing/boot-address';
import { provideLayout, ShellLayout } from '../layout/layout';
import { buildContentRoutes } from '../regions/content/routing/content-route-table';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { collectTabs } from '../regions/pane/tree/pane-queries';
import { WORKSPACE_SETTLEMENT } from '../regions/content/routing/workspace-settlement';
import { WorkspaceService } from './workspace.service';
import { provideWorkspaces } from './declaration/provide-workspaces';
import { WorkspaceDefinition } from './declaration/workspace-definition';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const LOAD_TIME_MS = 20;

function slowly(): Promise<typeof TestContent> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(TestContent), LOAD_TIME_MS),
  );
}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'dashboard', loadComponent: slowly },
  { path: 'reports', component: TestContent },
  { path: 'knowledge-base', loadComponent: slowly },
  { path: 'knowledge-base/:entryId', component: TestContent },
];

const LAYOUT: ShellLayout = {
  regions: [{ id: 'main', type: 'content', dock: 'center' }],
};

const DECLARED: readonly WorkspaceDefinition[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    initial: true,
    claims: ['dashboard'],
    content: { tabs: [{ path: 'dashboard', closable: false }] },
  },
  {
    id: 'knowledge-base',
    title: 'Knowledge base',
    claims: ['knowledge-base', 'knowledge-base/:entryId'],
    content: { tabs: [{ path: 'knowledge-base', closable: false }] },
  },
];

async function contentLoaded(): Promise<void> {
  await TestBed.inject(ApplicationRef).whenStable();
  await new Promise((resolve) => setTimeout(resolve, LOAD_TIME_MS * 2));
  await TestBed.inject(ApplicationRef).whenStable();
}

function renderRightAfterEverySwitch(workspaces: WorkspaceService): void {
  const switchTo = workspaces.switchTo.bind(workspaces);
  vi.spyOn(workspaces, 'switchTo').mockImplementation(async (id, options) => {
    await switchTo(id, options);
    TestBed.tick();
  });
}

const HELD_BESIDE: readonly WorkspaceDefinition[] = [
  DECLARED[0],
  {
    id: 'knowledge-base',
    title: 'Knowledge base',
    claims: ['knowledge-base'],
    content: {
      columns: [
        { tabs: [{ path: 'dashboard' }] },
        { tabs: [{ path: 'knowledge-base', closable: false }] },
      ],
    },
  },
];

async function openAtReports(
  declared: readonly WorkspaceDefinition[] = DECLARED,
): Promise<{
  readonly workspaces: WorkspaceService;
  readonly contentTabs: ContentTabsService;
  readonly tabs: () => readonly string[];
}> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(buildContentRoutes(ROUTES)),
      provideLayout(LAYOUT),
      { provide: BootAddress, useValue: { path: '/reports' } },
      { provide: WORKSPACE_SETTLEMENT, useExisting: WorkspaceService },
      provideWorkspaces(...declared),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  await RouterTestingHarness.create('/reports');
  const contentTabs = TestBed.inject(ContentTabsService);
  await contentLoaded();
  return {
    workspaces: TestBed.inject(WorkspaceService),
    contentTabs,
    tabs: () => contentTabs.tabs().map((tab) => tab.path),
  };
}

describe('leaving content behind', () => {
  beforeEach(() => localStorage.clear());

  it('does not bring the content the user left into the workspace switched to', async () => {
    const opened = await openAtReports();
    expect(opened.tabs()).toContain('reports');

    await opened.workspaces.switchTo('knowledge-base');
    TestBed.tick();
    await contentLoaded();

    expect(opened.workspaces.activeId()).toBe('knowledge-base');
    expect(opened.tabs()).toEqual(['knowledge-base']);
  });

  it('does not keep the content the user left in a reset arrangement', async () => {
    const opened = await openAtReports();

    await opened.workspaces.reset();
    TestBed.tick();
    await contentLoaded();

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(opened.tabs()).toEqual(['dashboard']);
  });

  it('does not bring the content the user left into the workspace a link moves them to', async () => {
    const opened = await openAtReports();

    renderRightAfterEverySwitch(opened.workspaces);

    await TestBed.inject(Router).navigateByUrl('/knowledge-base');
    await contentLoaded();

    expect(opened.workspaces.activeId()).toBe('knowledge-base');
    expect(opened.tabs()).toEqual(['knowledge-base']);
  });

  it('keeps a preview a preview when it is opened into the workspace that claims it', async () => {
    const opened = await openAtReports();

    opened.contentTabs.open({
      path: 'knowledge-base/e-1',
      title: 'Entry 1',
      titleIsLiteral: true,
      preview: true,
    });
    await contentLoaded();

    expect(opened.workspaces.activeId()).toBe('knowledge-base');
    const entry = opened.contentTabs
      .tabs()
      .find((tab) => tab.path === 'knowledge-base/e-1');
    expect(entry?.preview).toBe(true);
  });

  it('does not bring the content the user left into a workspace whose pane already holds what a plugin opens', async () => {
    const opened = await openAtReports(HELD_BESIDE);

    opened.contentTabs.open({
      path: 'knowledge-base',
      title: 'Knowledge base',
      titleIsLiteral: true,
    });
    await contentLoaded();

    expect(opened.workspaces.activeId()).toBe('knowledge-base');
    const everywhere = collectTabs(
      TestBed.inject(PaneTreeService).tree(CONTENT_DOCK),
    ).map((tab) => tab.path);
    expect(everywhere).not.toContain('reports');
  });

  it('does not bring the content the user left into any pane of a workspace that holds the linked content beside another', async () => {
    const opened = await openAtReports(HELD_BESIDE);

    await TestBed.inject(Router).navigateByUrl('/knowledge-base');
    await contentLoaded();

    expect(opened.workspaces.activeId()).toBe('knowledge-base');
    const everywhere = collectTabs(
      TestBed.inject(PaneTreeService).tree(CONTENT_DOCK),
    ).map((tab) => tab.path);
    expect(everywhere).not.toContain('reports');
  });

  it('opens content the workbench navigates to once, in the pane of the claiming workspace that holds it', async () => {
    const opened = await openAtReports(HELD_BESIDE);

    await opened.contentTabs.navigate('knowledge-base');
    await contentLoaded();

    expect(opened.workspaces.activeId()).toBe('knowledge-base');
    const everywhere = collectTabs(
      TestBed.inject(PaneTreeService).tree(CONTENT_DOCK),
    ).map((tab) => tab.path);
    expect(everywhere.filter((path) => path === 'knowledge-base')).toHaveLength(1);
    expect(everywhere).not.toContain('reports');
  });
});
