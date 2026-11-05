import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { DirtySurface } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { WORKING_STATE_STORE } from '../../../persistence/working-state-store';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { BUILT_IN_WORKSPACE_ID } from '../../../workspace/declaration/composed-definitions';
import { WorkspaceService } from '../../../workspace/workspace.service';
import { PaneActions } from '../../pane/pane-actions.service';
import { ParkedViewSweep } from '../../pane/retention/parked-view-sweep';
import { paneRetentionScope } from '../../pane/retention/retention-keys';
import { PaneLeaf, PaneNode, leafPath } from '../../pane/tree/pane-node';
import { leavesOf } from '../../pane/tree/pane-queries';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { ContentTabsService } from '../tabs/content-tabs.service';
import { SurfaceBody } from './surface-body';

let drafts: DraftView[] = [];

@Component({
  selector: 'lw-draft-view',
  template: `<span data-testid="draft">{{ draft() }}</span>`,
})
class DraftView implements OnDestroy, DirtySurface {
  readonly draft = signal('');
  readonly instanceId: unknown =
    inject(ActivatedRoute).snapshot.data['instanceId'];
  destroyed = false;

  constructor() {
    drafts.push(this);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  surfaceDirty(): boolean {
    return this.draft() !== '';
  }
}

@Component({
  imports: [SurfaceBody],
  template: `
    @for (pane of panes(); track pane.scope) {
      <lw-surface-body
        [attr.data-pane]="pane.scope"
        [path]="pane.path"
        [retentionScope]="pane.scope"
      />
    }
  `,
})
class DrawnPanes {
  private readonly paneTree = inject(PaneTreeService);
  readonly panes = computed(() =>
    leavesOf(this.paneTree.tree('left')).flatMap((leaf) => {
      const path = leafPath(leaf);
      return path === undefined
        ? []
        : [{ scope: paneRetentionScope('left', leaf.id), path }];
    }),
  );
}

function leaf(id: string, ...paths: string[]): PaneLeaf {
  return {
    kind: 'leaf',
    id,
    tabs: paths.map((path) => ({ path })),
    active: paths[0],
  };
}

function sideBySide(first: PaneLeaf, second: PaneLeaf): PaneNode {
  return {
    kind: 'split',
    id: 'root',
    orientation: 'row',
    ratio: 0.5,
    first,
    second,
  };
}

async function settled(fixture: ComponentFixture<DrawnPanes>): Promise<void> {
  fixture.detectChanges();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
  fixture.detectChanges();
}

function draftsShown(fixture: ComponentFixture<DrawnPanes>): string[] {
  return [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll(
      '[data-pane="left:b"] [data-testid="draft"]',
    ),
  ].map((node) => node.textContent ?? '');
}

function withoutPeek() {
  const kept = new Map<string, string>();
  return {
    get: (key: string) => Promise.resolve(kept.get(key)),
    set: (key: string, value: string) => {
      kept.set(key, value);
      return Promise.resolve();
    },
    delete: (key: string) => {
      kept.delete(key);
      return Promise.resolve();
    },
  };
}

function living(): DraftView[] {
  return drafts.filter((draft) => !draft.destroyed);
}

describe('the route a surface is built with, once its tab was carried to another pane', () => {
  async function arranged() {
    localStorage.clear();
    drafts = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: ContentTabsService,
          useValue: {
            activeTabRoot: () => '',
            neighbourOf: () => '',
            navigateTo: vi.fn(),
            activateViewTab: vi.fn(),
          },
        },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const path of ['notes', 'other', 'third']) {
      registry.addContentRoute({ path, component: DraftView });
    }
    const paneTree = TestBed.inject(PaneTreeService);
    TestBed.inject(ParkedViewSweep).start();
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'notes', 'other'), leaf('b', 'third')),
    );
    const fixture = TestBed.createComponent(DrawnPanes);
    await settled(fixture);
    const carried = drafts[0];
    return { fixture, paneTree, carried };
  }

  it('belongs to that instance only: the next one in the pane it was carried to is built by that pane', async () => {
    const { fixture, paneTree, carried } = await arranged();
    TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
    await settled(fixture);
    expect(carried.destroyed).toBe(false);

    paneTree.setActiveTab('left', 'b', 'third');
    await settled(fixture);
    paneTree.setActiveTab('left', 'b', 'notes');
    await settled(fixture);
    paneTree.insertTab('left', 'main', 'notes');
    await settled(fixture);

    expect(carried.destroyed).toBe(true);
    const ids = living().map((draft) => draft.instanceId);
    expect(ids).toContain('left:b|notes');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is not handed to a new surface in the pane it left while the carried one lives', async () => {
    const { fixture, paneTree, carried } = await arranged();
    carried.draft.set('typed');
    TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
    await settled(fixture);

    paneTree.insertTab('left', 'main', 'notes');
    await settled(fixture);

    expect(carried.destroyed).toBe(false);
    const ids = living().map((draft) => draft.instanceId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('a tab carried to another pane, through a workspace switch', () => {
  async function carried(
    store?: ReturnType<typeof withoutPeek>,
    first: (workspaces: WorkspaceService) => Promise<void> = () =>
      Promise.resolve(),
  ) {
    localStorage.clear();
    drafts = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        ...(store ? [{ provide: WORKING_STATE_STORE, useValue: store }] : []),
        {
          provide: ContentTabsService,
          useValue: {
            activeTabRoot: () => '',
            neighbourOf: () => '',
            navigateTo: vi.fn(),
            activateViewTab: vi.fn(),
          },
        },
      ],
    });
    const registry = TestBed.inject(ContributionRegistry);
    for (const path of ['notes', 'other', 'third']) {
      registry.addContentRoute({ path, component: DraftView });
    }
    const paneTree = TestBed.inject(PaneTreeService);
    await TestBed.inject(ActiveWorkspaceService).ready;
    await vi.waitFor(() => expect(paneTree.hydrated()).toBe(true));
    const workspaces = TestBed.inject(WorkspaceService);
    TestBed.inject(ParkedViewSweep).start();
    await first(workspaces);
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'notes', 'other'), leaf('b', 'third')),
    );
    const fixture = TestBed.createComponent(DrawnPanes);
    await settled(fixture);
    const typed = drafts[0];
    typed.draft.set('typed');
    TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
    await settled(fixture);
    expect(draftsShown(fixture)).toEqual(['typed']);
    return { fixture, typed, workspaces, paneTree };
  }

  it('is still the same instance where the workspace arrived at has the same pane and tab', async () => {
    const { fixture, typed, workspaces } = await carried();

    await workspaces.saveCurrent('a copy of this arrangement');
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(draftsShown(fixture)).toEqual(['typed']);
  });

  it('is still there on return when panes were drawn while the other workspace was being read', async () => {
    let elsewhere = '';
    const { fixture, typed, workspaces } = await carried(
      withoutPeek(),
      async (service) => {
        await service.saveCurrent('elsewhere');
        elsewhere = service.activeId();
        await service.switchTo(BUILT_IN_WORKSPACE_ID);
      },
    );

    const leaving = workspaces.switchTo(elsewhere);
    fixture.detectChanges();
    await leaving;
    await settled(fixture);

    expect(draftsShown(fixture)).toEqual([]);

    await workspaces.switchTo(BUILT_IN_WORKSPACE_ID);
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(draftsShown(fixture)).toEqual(['typed']);
  });
});
