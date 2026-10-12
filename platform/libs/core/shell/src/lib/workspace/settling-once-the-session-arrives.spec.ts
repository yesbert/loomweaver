import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ANONYMOUS, AuthSnapshot, ContentRoute } from '@loomweaver/plugin-sdk';
import { AUTH_SOURCE } from '../auth/auth-context';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { provideLayout, ShellLayout } from '../layout/layout';
import { BootAddress } from '../regions/content/routing/boot-address';
import { buildContentRoutes } from '../regions/content/routing/content-route-table';
import { WORKSPACE_SETTLEMENT } from '../regions/content/routing/workspace-settlement';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { collectTabPaths } from '../regions/pane/tree/pane-queries';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { provideWorkspaces } from './declaration/provide-workspaces';
import { WorkspaceDefinition } from './declaration/workspace-definition';
import { WorkspaceService } from './workspace.service';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'dashboard', component: TestContent },
  { path: 'records', component: TestContent, access: { authenticated: true } },
  { path: 'notes', component: TestContent },
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
    id: 'records',
    title: 'Records',
    claims: ['records'],
    content: { tabs: [{ path: 'records', closable: false }] },
  },
];

const SIGNED_IN: AuthSnapshot = {
  authenticated: true,
  subject: 'ada',
  roles: [],
  claims: {},
};

async function settled(): Promise<void> {
  await TestBed.inject(ApplicationRef).whenStable();
  await new Promise((resolve) => setTimeout(resolve, 20));
  await TestBed.inject(ApplicationRef).whenStable();
}

async function openedBeforeTheSessionAt(address: string) {
  const session = signal<AuthSnapshot>(ANONYMOUS);
  TestBed.configureTestingModule({
    providers: [
      provideRouter(buildContentRoutes(ROUTES)),
      provideLayout(LAYOUT),
      { provide: BootAddress, useValue: { path: address } },
      { provide: AUTH_SOURCE, useValue: session },
      { provide: WORKSPACE_SETTLEMENT, useExisting: WorkspaceService },
      provideWorkspaces(...DECLARED),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  const workspaces = TestBed.inject(WorkspaceService);
  await RouterTestingHarness.create(address);
  await settled();
  const contentTabs = () =>
    collectTabPaths(TestBed.inject(PaneTreeService).tree(CONTENT_DOCK));
  const visitAgain = async () => {
    await TestBed.inject(Router).navigateByUrl('/notes');
    await settled();
    await TestBed.inject(Router).navigateByUrl(address);
    await settled();
  };
  return {
    workspaces,
    contentTabs,
    visitAgain,
    sessionArrives: async () => {
      session.set(SIGNED_IN);
      await TestBed.inject(Router).navigateByUrl(address, {
        onSameUrlNavigation: 'reload',
      });
      await settled();
    },
  };
}

describe('settling once the session arrives', () => {
  beforeEach(() => localStorage.clear());

  it('leaves the gated content where the session finds it until it qualifies', async () => {
    const opened = await openedBeforeTheSessionAt('/records');

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(opened.contentTabs()).toContain('records');
  });

  it('moves into the claiming workspace once the session qualifies', async () => {
    const opened = await openedBeforeTheSessionAt('/records');

    await opened.sessionArrives();

    expect(opened.workspaces.activeId()).toBe('records');
    expect(opened.contentTabs()).toEqual(['records']);
  });

  it('takes the content out of the workspace it waited in', async () => {
    const opened = await openedBeforeTheSessionAt('/records');
    await opened.sessionArrives();

    await opened.workspaces.switchTo('dashboard');
    await settled();

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(opened.contentTabs()).toEqual(['dashboard']);
  });

  it('takes the content out even when it was visited again while waiting', async () => {
    const opened = await openedBeforeTheSessionAt('/records');
    await opened.visitAgain();
    await opened.sessionArrives();

    await opened.workspaces.switchTo('dashboard');
    await settled();

    expect(opened.contentTabs()).toEqual(['dashboard', 'notes']);
  });

  it('keeps unclaimed content where it was opened', async () => {
    const opened = await openedBeforeTheSessionAt('/notes');
    await opened.sessionArrives();

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(opened.contentTabs()).toContain('notes');
  });
});
