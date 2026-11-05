import {
  Component,
  Injector,
  OnDestroy,
  Type,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirtySurface } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { ContentTabsService } from '../../content/tabs/content-tabs.service';
import { PaneMoveService } from '../drag/pane-move.service';
import { PaneActions } from '../pane-actions.service';
import { keepsEverything } from '../tree/pane-handover';
import { isViewPanePath } from '../tree/pane-address';
import { PaneLeaf, PaneNode, PaneTab, activeTab } from '../tree/pane-node';
import { leavesOf } from '../tree/pane-queries';
import { PaneTreeService } from '../tree/pane-tree.service';
import { ParkedViewSweep } from './parked-view-sweep';
import { RetainedComponent } from './retained-component';
import { RetainedViewStash } from './retained-view-stash';
import {
  paneRetentionScope,
  surfaceRetentionKey,
  viewRetentionKey,
} from './retention-keys';
import { SurfaceRetentionMode } from './retention-policy';
import { tabRootOf } from '../../content/content-path';

let drafts: DraftView[] = [];

@Component({
  selector: 'lw-draft-view',
  template: `<span data-testid="draft">{{ draft() }}</span>`,
})
class DraftView implements OnDestroy, DirtySurface {
  readonly draft = signal('');
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
  imports: [RetainedComponent],
  template: `
    @for (pane of panes(); track pane.scope) {
      <div [attr.data-pane]="pane.scope">
        <ng-container
          [lwRetainedComponent]="component"
          [componentInjector]="injector"
          [retentionKey]="pane.key"
          [mode]="mode()"
        />
      </div>
    }
  `,
})
class PanesHost {
  private readonly paneTree = inject(PaneTreeService);
  private readonly registry = inject(ContributionRegistry);
  readonly component: Type<unknown> = DraftView;
  readonly injector = inject(Injector);
  readonly mode = signal<SurfaceRetentionMode>('move');
  readonly panes = computed(() =>
    Object.entries(this.paneTree.dockTrees()).flatMap(([dock, tree]) =>
      leavesOf(tree).flatMap((leaf) => {
        const tab = activeTab(leaf);
        const scope = paneRetentionScope(dock, leaf.id);
        return tab === undefined
          ? []
          : [{ scope, key: this.keyOf(scope, tab) }];
      }),
    ),
  );

  private keyOf(scope: string, tab: PaneTab): string {
    return isViewPanePath(tab.path)
      ? viewRetentionKey(scope, tab.path, tab.instance)
      : surfaceRetentionKey(
          scope,
          tabRootOf(this.registry.contentRoutes(), tab.path),
        );
  }
}

function leaf(id: string, ...tabs: (string | PaneTab)[]): PaneLeaf {
  const held = tabs.map((tab) =>
    typeof tab === 'string' ? { path: tab } : tab,
  );
  return { kind: 'leaf', id, tabs: held, active: held[0]?.path };
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

async function settled(fixture: ComponentFixture<PanesHost>): Promise<void> {
  fixture.detectChanges();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
  fixture.detectChanges();
}

function draftsShownIn(
  fixture: ComponentFixture<PanesHost>,
  scope: string,
): string[] {
  const pane: HTMLElement = fixture.nativeElement.querySelector(
    `[data-pane="${CSS.escape(scope)}"]`,
  );
  return [...pane.querySelectorAll('[data-testid="draft"]')].map(
    (node) => node.textContent ?? '',
  );
}

describe('a tab that changes panes keeps its unsaved work', () => {
  let paneTree: PaneTreeService;
  let stash: RetainedViewStash;

  beforeEach(() => {
    localStorage.clear();
    drafts = [];
    TestBed.configureTestingModule({
      providers: [
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
    for (const path of ['notes', 'other', 'third', 'doc/:id']) {
      registry.addContentRoute({ path, component: DraftView });
    }
    registry.addView({
      id: 'outline',
      region: 'primary',
      title: 'outline.title',
      component: DraftView,
    });
    paneTree = TestBed.inject(PaneTreeService);
    stash = TestBed.inject(RetainedViewStash);
    TestBed.inject(ParkedViewSweep).start();
  });

  async function typedInto(
    scope: string,
    address = 'notes',
    mode: SurfaceRetentionMode = 'move',
  ): Promise<{
    fixture: ComponentFixture<PanesHost>;
    typed: DraftView;
  }> {
    const fixture = TestBed.createComponent(PanesHost);
    fixture.componentInstance.mode.set(mode);
    await settled(fixture);
    const [typed] = stash.instancesFor(scope, address) as DraftView[];
    typed.draft.set('typed');
    await settled(fixture);
    return { fixture, typed };
  }

  it('moved to the strip of another pane, it is the same instance there', async () => {
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'notes', 'other'), leaf('b', 'third')),
    );
    const { fixture, typed } = await typedInto('left:main');

    TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(draftsShownIn(fixture, 'left:b')).toEqual(['typed']);
    expect(stash.instancesFor('left:main', 'notes')).toEqual([]);
  });

  it('dropped on an edge, it is the same instance in the pane that opens for it', async () => {
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'notes', 'other'), leaf('b', 'third')),
    );
    const { fixture, typed } = await typedInto('left:main');

    TestBed.inject(PaneMoveService).moveToEdge(
      { dock: 'left', paneId: 'main' },
      'notes',
      { dock: 'left', paneId: 'b' },
      'right',
    );
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('typed');
    expect(stash.instances()).toContain(typed);
  });

  it('split out of a pane it leaves empty, it is the same instance beside it', async () => {
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'other'), leaf('b', 'notes', 'third')),
    );
    const { fixture, typed } = await typedInto('left:b');

    TestBed.inject(PaneMoveService).splitTabOut('notes', 'row', {
      dock: 'left',
      paneId: 'b',
    });
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('typed');
  });

  it('moved to another dock, it is the same instance there', async () => {
    paneTree.commit('left', leaf('main', 'notes', 'other'));
    paneTree.commit('right', leaf('main', 'third'));
    const { fixture, typed } = await typedInto('left:main');

    TestBed.inject(PaneMoveService).moveToStrip(
      { dock: 'left', paneId: 'main' },
      'notes',
      { dock: 'right', paneId: 'main' },
    );
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(draftsShownIn(fixture, 'right:main')).toEqual(['typed']);
  });

  it('handed to the neighbour when its pane closes, it waits there behind the tab shown', async () => {
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'other'), leaf('b', 'notes')),
    );
    const { fixture, typed } = await typedInto('left:b');

    paneTree.closePane('left', 'b', keepsEverything);
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(stash.instancesFor('left:main', 'notes')).toEqual([typed]);

    paneTree.setActiveTab('left', 'main', 'notes');
    await settled(fixture);

    expect(draftsShownIn(fixture, 'left:main')).toEqual(['typed']);
  });

  it('handed to the remaining pane when a split is undone, it waits there', async () => {
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'other'), leaf('b', 'notes')),
    );
    const { fixture, typed } = await typedInto('left:b');

    paneTree.unsplit('left', keepsEverything);
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(stash.instancesFor('left:main', 'notes')).toEqual([typed]);
  });

  it('handed to the pane that takes over when the first pane closes, it waits there', async () => {
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'notes'), leaf('b', 'other')),
    );
    const { fixture, typed } = await typedInto('left:main');

    paneTree.collapsePrimary('left', keepsEverything);
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(stash.instancesFor('left:b', 'notes')).toEqual([typed]);
  });

  it('a tab shown below its address is carried with the surface of that address', async () => {
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'doc/7/details', 'other'), leaf('b', 'third')),
    );
    const { fixture, typed } = await typedInto('left:main', 'doc/7');

    TestBed.inject(PaneActions).moveTab('doc/7/details', 'left', 'b');
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(draftsShownIn(fixture, 'left:b')).toEqual(['typed']);
  });

  it('a view tab is carried as the instance it names', async () => {
    paneTree.commit(
      'left',
      leaf('main', { path: 'view:outline', instance: 'one' }, 'other'),
    );
    paneTree.commit('right', leaf('main', 'third'));
    const { fixture, typed } = await typedInto('left:main', 'view:outline');

    TestBed.inject(PaneMoveService).moveToStrip(
      { dock: 'left', paneId: 'main' },
      'view:outline',
      { dock: 'right', paneId: 'main' },
    );
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(draftsShownIn(fixture, 'right:main')).toEqual(['typed']);
  });

  it('what another workspace parked under the same pane is left where it is', async () => {
    paneTree.commit('left', leaf('main', 'notes', 'other'));
    const { fixture, typed } = await typedInto('left:main');
    TestBed.inject(ActiveWorkspaceService).set('elsewhere');
    paneTree.hydrate(undefined);
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'other', 'notes'), leaf('b', 'third')),
    );
    await settled(fixture);

    TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(stash.instancesFor('left:main', 'notes')).toEqual([typed]);
    expect(draftsShownIn(fixture, 'left:b')).toEqual(['']);
  });

  it('a tab that stays where it is keeps the instance of its own pane', async () => {
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'notes', 'other'), leaf('b', 'notes')),
    );
    const { fixture, typed } = await typedInto('left:main');
    const [untouched] = stash.instancesFor('left:b', 'notes') as DraftView[];

    paneTree.setActiveTab('left', 'main', 'other');
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(stash.instancesFor('left:main', 'notes')).toEqual([typed]);
    expect(stash.instancesFor('left:b', 'notes')).toEqual([untouched]);
  });
});

describe('a surface that is hidden in place and changes panes', () => {
  interface MovableParent extends HTMLElement {
    moveBefore(node: Node, child: Node | null): void;
  }

  beforeEach(() => {
    localStorage.clear();
    drafts = [];
    (Element.prototype as Partial<MovableParent>).moveBefore = function (
      this: HTMLElement,
      node: Node,
      child: Node | null,
    ) {
      this.insertBefore(node, child);
    };
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'notes',
      component: DraftView,
    });
    TestBed.inject(ContributionRegistry).addContentRoute({
      path: 'other',
      component: DraftView,
    });
    TestBed.inject(ParkedViewSweep).start();
  });

  afterEach(() => {
    delete (Element.prototype as Partial<MovableParent>).moveBefore;
  });

  it('leaves the pane that closes before the pane is taken down, so it is moved rather than rebuilt', async () => {
    const paneTree = TestBed.inject(PaneTreeService);
    const stash = TestBed.inject(RetainedViewStash);
    paneTree.commit(
      'left',
      sideBySide(leaf('main', 'other'), leaf('b', 'notes')),
    );
    const fixture = TestBed.createComponent(PanesHost);
    fixture.componentInstance.mode.set('in-place');
    await settled(fixture);
    const [typed] = stash.instancesFor('left:b', 'notes') as DraftView[];
    typed.draft.set('typed');
    await settled(fixture);
    const element = fixture.nativeElement.querySelector(
      '[data-pane="left:b"] lw-draft-view',
    );

    paneTree.closePane('left', 'b', keepsEverything);
    await settled(fixture);
    paneTree.setActiveTab('left', 'main', 'notes');
    await settled(fixture);

    expect(typed.destroyed).toBe(false);
    expect(
      fixture.nativeElement.querySelector(
        '[data-pane="left:main"] lw-draft-view',
      ),
    ).toBe(element);
    expect(draftsShownIn(fixture, 'left:main')).toContain('typed');
  });
});
