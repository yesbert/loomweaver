import {
  ApplicationRef,
  Component,
  ComponentRef,
  createComponent,
  EmbeddedViewRef,
  EnvironmentInjector,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ContentRoute } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../contributions/contribution-registry';
import { provideLayout } from '../layout/layout';
import { KeyValueStore } from '../persistence/key-value-store';
import { provideSettingsStore } from '../persistence/settings-store';
import { provideWorkingStateStore } from '../persistence/working-state-store';
import { BootAddress } from '../regions/content/routing/boot-address';
import { buildContentRoutes } from '../regions/content/routing/content-route-table';
import { WORKSPACE_SETTLEMENT } from '../regions/content/routing/workspace-settlement';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import { SurfaceCloseGuard } from '../regions/pane/unsaved-work/surface-close-guard';
import { provideWorkspaces } from './declaration/provide-workspaces';
import { WorkspaceService } from './workspace.service';

@Component({ selector: 'lw-test-content', template: '' })
class TestContent {}

@Component({ selector: 'lw-test-draft', template: '' })
class Draft {
  surfaceDirty(): boolean {
    return true;
  }
}

const ROUTES: readonly ContentRoute[] = [
  { path: '', component: TestContent },
  { path: 'dashboard', component: TestContent },
  { path: 'reports', component: TestContent },
  { path: 'notes', component: TestContent },
];

const DECLARED = {
  id: 'dashboard',
  title: 'Dashboard',
  initial: true,
  claims: ['dashboard'],
  content: { tabs: [{ path: 'dashboard', closable: false }] },
} as const;

const ACTIVE = 'lw.shell.active-workspace';

class AnsweringStore implements KeyValueStore {
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

class LateStore extends AnsweringStore {
  override get(key: string): Promise<string | undefined> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(super.get(key)), 5),
    );
  }
}

async function settled(): Promise<void> {
  await TestBed.inject(ApplicationRef).whenStable();
  await new Promise((resolve) => setTimeout(resolve, 30));
  await TestBed.inject(ApplicationRef).whenStable();
}

async function openedInAWorkspaceNothingLists(
  answer: boolean,
  stored: Readonly<Record<string, string>> = {},
  address = '/reports',
) {
  const stores = new Map<string, string>([
    [ACTIVE, 'gone'],
    ...Object.entries(stored),
  ]);
  const guard = {
    confirmDiscard: vi.fn<(candidates: readonly unknown[]) => Promise<boolean>>(
      async () => answer,
    ),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter(buildContentRoutes(ROUTES)),
      provideLayout({
        regions: [{ id: 'main', type: 'content', dock: 'center' }],
      }),
      { provide: BootAddress, useValue: { path: address } },
      { provide: WORKSPACE_SETTLEMENT, useExisting: WorkspaceService },
      { provide: SurfaceCloseGuard, useValue: guard },
      provideWorkspaces(DECLARED),
      provideSettingsStore(new LateStore(stores)),
      provideWorkingStateStore(new AnsweringStore(stores)),
    ],
  });
  const registry = TestBed.inject(ContributionRegistry);
  for (const route of ROUTES) registry.addContentRoute(route);
  await RouterTestingHarness.create(address);
  const workspaces = TestBed.inject(WorkspaceService);
  await TestBed.inject(ApplicationRef).whenStable();
  return { workspaces, stores, guard };
}

function draft(key: string, placement: 'shown' | 'parked'): ComponentRef<Draft> {
  const ref = createComponent(Draft, {
    environmentInjector: TestBed.inject(EnvironmentInjector),
  });
  const slot = TestBed.inject(RetainedViewStash).acquire(key, Draft, () => ({
    view: ref.hostView as EmbeddedViewRef<unknown>,
    instance: ref.instance,
  }));
  if (placement === 'parked') {
    slot.detach(true);
  }
  return ref;
}

describe('a stored workspace that turns out to be unlisted', () => {
  it('asks about the unsaved work giving way would destroy, and leaves the user there when they keep it', async () => {
    const opened = await openedInAWorkspaceNothingLists(false);
    expect(opened.workspaces.activeId()).toBe('gone');
    const parked = draft('content:main|notes', 'parked');

    await settled();

    expect(opened.guard.confirmDiscard).toHaveBeenCalledTimes(1);
    expect(opened.guard.confirmDiscard).toHaveBeenLastCalledWith([
      parked.instance,
    ]);
    expect(opened.workspaces.activeId()).toBe('gone');
    expect(opened.stores.get(ACTIVE)).toBe('gone');
    expect(parked.hostView.destroyed).toBe(false);
  });

  it('does not ask about unsaved work at the address it keeps', async () => {
    const opened = await openedInAWorkspaceNothingLists(true);
    const shown = draft('content:main|reports', 'shown');

    await settled();

    expect(opened.guard.confirmDiscard).toHaveBeenLastCalledWith([]);
    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(TestBed.inject(Location).path()).toBe('/reports');
    expect(shown.hostView.destroyed).toBe(false);
  });

  it('leaves neither parked work nor stored working state of it behind once it has given way', async () => {
    const opened = await openedInAWorkspaceNothingLists(true, {
      'lw.shell.pane-trees:gone': JSON.stringify({
        content: {
          tree: {
            kind: 'leaf',
            id: 'main',
            tabs: [{ path: 'notes' }],
            active: 'notes',
          },
          primary: 'main',
        },
      }),
      'lw.shell.hidden-views:gone': '["outline"]',
    });
    const parked = draft('content:main|notes', 'parked');

    await settled();

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(opened.stores.get(ACTIVE)).toBe('dashboard');
    expect(opened.stores.has('lw.shell.pane-trees:gone')).toBe(false);
    expect(opened.stores.has('lw.shell.hidden-views:gone')).toBe(false);
    expect(parked.hostView.destroyed).toBe(true);
    expect(TestBed.inject(RetainedViewStash).parkedInstancesOf('gone')).toEqual(
      [],
    );
  });

  it('leaves no stored working state of it behind where the opening had already landed in the declared start', async () => {
    const opened = await openedInAWorkspaceNothingLists(
      true,
      { 'lw.shell.hidden-views:gone': '["outline"]' },
      '/',
    );

    await settled();

    expect(opened.workspaces.activeId()).toBe('dashboard');
    expect(TestBed.inject(Location).path()).toBe('/dashboard');
    expect(opened.stores.has('lw.shell.hidden-views:gone')).toBe(false);
  });
});
