import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { provideLayout } from '../layout/layout';
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
];

const LAYOUT = {
  regions: [{ id: 'main', type: 'content', dock: 'center' }],
} as const;

async function compose(): Promise<{
  workspaces: WorkspaceService;
  tabs: ContentTabsService;
}> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(buildContentRoutes(ROUTES)),
      provideLayout(LAYOUT as never),
      { provide: WORKSPACE_CLAIMS, useExisting: WorkspaceService },
      provideWorkspaces(
        { id: 'overview', title: 'Overview', initial: true, claims: [''] },
        {
          id: 'quotes',
          title: 'Quotes',
          claims: ['quotes/:id'],
          content: { tabs: [{ path: 'quotes/q-0005', closable: false }] },
        },
      ),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  await RouterTestingHarness.create();
  return {
    workspaces: TestBed.inject(WorkspaceService),
    tabs: TestBed.inject(ContentTabsService),
  };
}

async function settled(): Promise<void> {
  await TestBed.inject(ApplicationRef).whenStable();
}

describe('a workspace remembers which tab was active', () => {
  beforeEach(() => localStorage.clear());

  it('returns to the tab that was active, not to the declared one', async () => {
    const { workspaces, tabs } = await compose();
    await workspaces.switchTo('quotes');
    await settled();

    tabs.open({ path: 'quotes/q-0007', title: 'Q-0007', titleIsLiteral: true });
    tabs.keep('quotes/q-0007');
    await settled();
    expect(tabs.activePath()).toBe('quotes/q-0007');

    await workspaces.switchTo('overview');
    await settled();
    await workspaces.switchTo('quotes');
    await settled();

    expect(tabs.activePath()).toBe('quotes/q-0007');
  });
});
