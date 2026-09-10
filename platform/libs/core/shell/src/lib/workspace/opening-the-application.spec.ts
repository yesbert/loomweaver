import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { BootAddress } from '../regions/content/routing/boot-address';
import { provideLayout } from '../layout/layout';
import { KeyValueStore } from '../persistence/key-value-store';
import { provideSettingsStore } from '../persistence/settings-store';
import { provideWorkingStateStore } from '../persistence/working-state-store';
import { buildContentRoutes } from '../regions/content/routing/content-router';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { WORKSPACE_CLAIMS } from '../foundation/workspace-claims';
import { WorkspaceService } from './workspace.service';
import { provideWorkspaces } from './provide-workspaces';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'dashboard', component: TestContent },
  { path: 'reports', component: TestContent },
  { path: 'knowledge-base', component: TestContent },
];

const LAYOUT = {
  regions: [{ id: 'main', type: 'content', dock: 'center' }],
} as const;

const DECLARED = [
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
    claims: ['knowledge-base'],
    content: { tabs: [{ path: 'knowledge-base', closable: false }] },
  },
] as const;

class AsyncStore implements KeyValueStore {
  constructor(private readonly data: Map<string, string>) {}

  get(key: string): Promise<string | undefined> {
    return Promise.resolve(this.data.get(key));
  }

  set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.data.delete(key);
    return Promise.resolve();
  }
}

interface Opened {
  readonly workspaces: WorkspaceService;
  readonly tabs: ContentTabsService;
  readonly location: Location;
}

async function settled(): Promise<void> {
  await TestBed.inject(ApplicationRef).whenStable();
  for (let turn = 0; turn < 5; turn += 1) {
    await Promise.resolve();
  }
  await TestBed.inject(ApplicationRef).whenStable();
}

async function open(
  address = '/',
  options: {
    declared?: readonly unknown[];
    stores?: Map<string, string>;
  } = {},
): Promise<Opened> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(buildContentRoutes(ROUTES)),
      provideLayout(LAYOUT as never),
      { provide: BootAddress, useValue: { path: address } },
      { provide: WORKSPACE_CLAIMS, useExisting: WorkspaceService },
      provideWorkspaces(...((options.declared ?? DECLARED) as never[])),
      ...(options.stores
        ? [
            provideSettingsStore(new AsyncStore(options.stores)),
            provideWorkingStateStore(new AsyncStore(options.stores)),
          ]
        : []),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  await RouterTestingHarness.create(address);
  const opened = {
    workspaces: TestBed.inject(WorkspaceService),
    tabs: TestBed.inject(ContentTabsService),
    location: TestBed.inject(Location),
  };
  await settled();
  return opened;
}

function keepStorage(): Map<string, string> {
  return new Map(Object.entries({ ...localStorage }));
}

function restoreStorage(kept: Map<string, string>): void {
  localStorage.clear();
  for (const [key, value] of kept) {
    localStorage.setItem(key, value);
  }
}

describe('opening the application where the distribution says', () => {
  beforeEach(() => localStorage.clear());

  it('lands in the declared workspace on a first visit', async () => {
    const opened = await open();

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(opened.location.path()).toBe('/dashboard');
  });

  it('lands there again after the user has been somewhere else', async () => {
    const first = await open();
    await first.workspaces.switchTo('knowledge-base');
    await settled();
    expect(first.workspaces.activeId()).toBe('knowledge-base');

    const kept = keepStorage();
    TestBed.resetTestingModule();
    restoreStorage(kept);

    const again = await open();

    expect(again.workspaces.activeId()).toBe('dashboard');
    expect(again.location.path()).toBe('/dashboard');
  });

  it('shows the declared workspace as it was left', async () => {
    const first = await open();
    first.tabs.open({
      path: 'reports',
      title: 'Reports',
      titleIsLiteral: true,
    });
    first.tabs.keep('reports');
    await settled();
    expect(first.tabs.tabs().map((tab) => tab.path)).toContain('reports');

    const kept = keepStorage();
    TestBed.resetTestingModule();
    restoreStorage(kept);

    const again = await open();

    expect(again.tabs.tabs().map((tab) => tab.path)).toContain('reports');
  });

  it('leaves the workspace the user left as they left it', async () => {
    const first = await open();
    await first.workspaces.switchTo('knowledge-base');
    await settled();
    first.tabs.open({
      path: 'reports',
      title: 'Reports',
      titleIsLiteral: true,
    });
    first.tabs.keep('reports');
    await settled();

    const kept = keepStorage();
    TestBed.resetTestingModule();
    restoreStorage(kept);

    const again = await open();
    expect(again.workspaces.activeId()).toBe('dashboard');
    await again.workspaces.switchTo('knowledge-base');
    await settled();

    expect(again.tabs.tabs().map((tab) => tab.path)).toContain('reports');
  });

  it('leaves no step in the history behind', async () => {
    const opened = await open();
    expect(opened.location.path()).toBe('/dashboard');

    opened.location.back();
    await settled();

    expect(opened.location.path()).toBe('/dashboard');
  });

  it('lets an address that names content win', async () => {
    const opened = await open('/knowledge-base');

    expect(opened.location.path()).toBe('/knowledge-base');
    expect(opened.workspaces.activeId()).toBe('knowledge-base');
  });

  it('leaves the address alone where the declaration holds no content', async () => {
    const opened = await open('/', {
      declared: [
        { id: 'overview', title: 'Overview', initial: true, claims: [''] },
      ],
    });

    expect(opened.workspaces.activeId()).toBe('overview');
    expect(opened.location.path()).toBe('');
  });

  it('lands there with a working state that reads back asynchronously', async () => {
    const stores = new Map<string, string>();
    const first = await open('/', { stores });
    await first.workspaces.switchTo('knowledge-base');
    await settled();

    TestBed.resetTestingModule();
    const again = await open('/', { stores });

    expect(again.workspaces.activeId()).toBe('dashboard');
    expect(again.location.path()).toBe('/dashboard');
  });
});
