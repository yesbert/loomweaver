import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ANONYMOUS, AuthSnapshot, ContentRoute } from '@loomweaver/plugin-sdk';
import { AUTH_SOURCE } from '../auth/auth-context';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { provideIdentityScopedStores } from '../persistence/identity-scope/provide-identity-scoped-stores';
import { provideLayout, ShellLayout } from '../layout/layout';
import { StateSyncService } from '../persistence/cross-tab/state-sync.service';
import { KeyValueStore } from '../persistence/key-value-store';
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
  { path: 'archive', component: TestContent, access: { authenticated: true } },
  { path: 'notes', component: TestContent },
  { path: 'journal', component: TestContent },
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
    claims: ['records', 'archive'],
    content: { tabs: [{ path: 'records', closable: false }] },
  },
  {
    id: 'journal',
    title: 'Journal',
    claims: ['journal'],
    content: { tabs: [{ path: 'journal', closable: false }] },
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

const ARRANGED_WITH_RECORDS = JSON.stringify({
  content: {
    tree: {
      kind: 'leaf',
      id: 'main',
      tabs: [{ path: 'dashboard', closable: false }, { path: 'records' }],
      active: 'dashboard',
    },
    primary: 'main',
  },
});

class SavedListThatDoesNotAnswerTheAnonymous implements KeyValueStore {
  get(key: string): Promise<string | undefined> {
    return key === 'lw.shell.workspaces'
      ? new Promise(() => undefined)
      : Promise.resolve(undefined);
  }

  set(): Promise<void> {
    return Promise.resolve();
  }

  delete(): Promise<void> {
    return Promise.resolve();
  }
}

async function openedBeforeTheSessionAt(
  address: string,
  {
    scopedToThePerson = false,
    settingsStore = undefined as KeyValueStore | undefined,
    anEarlierAdopterTakesItsTime = false,
  } = {},
) {
  const session = signal<AuthSnapshot>(ANONYMOUS);
  TestBed.configureTestingModule({
    providers: [
      ...(scopedToThePerson
        ? provideIdentityScopedStores({
            identity: () => session().subject ?? null,
            settingsStore,
          })
        : []),
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
  if (anEarlierAdopterTakesItsTime) {
    TestBed.inject(StateSyncService).onNamespaceAdopted(
      () => new Promise((resolve) => setTimeout(resolve, 30)),
    );
  }
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
  const goTo = async (path: string) => {
    await TestBed.inject(Router).navigateByUrl(path);
    await settled();
  };
  return {
    workspaces,
    contentTabs,
    visitAgain,
    goTo,
    sessionArrivesElsewhere: async () => {
      session.set(SIGNED_IN);
      await settled();
    },
    sessionArrivesAt: async (path: string) => {
      session.set(SIGNED_IN);
      await TestBed.inject(Router).navigateByUrl(path, {
        onSameUrlNavigation: 'reload',
      });
      await settled();
    },
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

  it('takes the content out when the person moved on before the session arrived', async () => {
    const opened = await openedBeforeTheSessionAt('/records');
    await opened.goTo('/notes');

    await opened.sessionArrivesElsewhere();

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(opened.contentTabs()).toEqual(['dashboard', 'notes']);
  });

  it('takes out every claimed content that waited, not only the last', async () => {
    const opened = await openedBeforeTheSessionAt('/records');
    await opened.goTo('/archive');
    await opened.sessionArrivesAt('/archive');

    await opened.workspaces.switchTo('dashboard');
    await settled();

    expect(opened.contentTabs()).toEqual(['dashboard']);
  });

  it('takes the content out once the person is back in the workspace it waited in', async () => {
    const opened = await openedBeforeTheSessionAt('/records');
    await opened.workspaces.switchTo('journal');
    await settled();

    await opened.sessionArrivesElsewhere();
    await opened.workspaces.switchTo('dashboard');
    await settled();

    expect(opened.contentTabs()).toEqual(['dashboard']);
  });

  it("keeps what the person's own arrangement holds at the address", async () => {
    localStorage.setItem('lw.id.ada:lw.shell.active-workspace', 'dashboard');
    localStorage.setItem(
      'lw.id.ada:lw.shell.pane-trees:dashboard',
      ARRANGED_WITH_RECORDS,
    );
    const opened = await openedBeforeTheSessionAt('/records', {
      scopedToThePerson: true,
    });

    await opened.sessionArrivesAt('/records');

    expect(opened.workspaces.activeId()).toBe('records');
    expect(
      localStorage.getItem('lw.id.ada:lw.shell.pane-trees:dashboard'),
    ).toContain('"path":"records"');
  });

  it('keeps unclaimed content where it was opened', async () => {
    const opened = await openedBeforeTheSessionAt('/notes');
    await opened.sessionArrives();

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(opened.contentTabs()).toContain('notes');
  });

  it('gives way to the start for the session where the workspace the person last chose is not listed any more', async () => {
    localStorage.setItem('lw.id.ada:lw.shell.active-workspace', 'gone');
    const opened = await openedBeforeTheSessionAt('/notes', {
      scopedToThePerson: true,
    });

    await opened.sessionArrives();

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(opened.contentTabs()).toContain('notes');
    expect(
      localStorage.getItem('lw.id.ada:lw.shell.active-workspace'),
    ).toBe('gone');
  });

  it('lands in the workspace the person last chose, and leaves their choice alone, while a check begun before the session is still running', async () => {
    localStorage.setItem('lw.shell.active-workspace', 'gone');
    localStorage.setItem('lw.id.ada:lw.shell.active-workspace', 'journal');
    const opened = await openedBeforeTheSessionAt('/notes', {
      scopedToThePerson: true,
      settingsStore: new SavedListThatDoesNotAnswerTheAnonymous(),
      anEarlierAdopterTakesItsTime: true,
    });
    expect(opened.workspaces.activeId()).toBe('gone');

    await opened.sessionArrivesElsewhere();
    for (let turn = 0; turn < 5; turn += 1) {
      await settled();
    }

    expect(opened.workspaces.activeId()).toBe('journal');
    expect(
      localStorage.getItem('lw.id.ada:lw.shell.active-workspace'),
    ).toBe('journal');
  });
});
