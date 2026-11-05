import {
  Component,
  EmbeddedViewRef,
  EnvironmentInjector,
  Injector,
  OnDestroy,
  Type,
  computed,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirtySurface } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { DialogService } from '../../../dialog/dialog.service';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { ContentTabsService } from '../../content/tabs/content-tabs.service';
import { PaneMoveService } from '../drag/pane-move.service';
import { PaneActions } from '../pane-actions.service';
import { ParkedViewSweep } from '../retention/parked-view-sweep';
import { RetainedComponent } from '../retention/retained-component';
import { RetainedViewStash } from '../retention/retained-view-stash';
import {
  paneRetentionScope,
  surfaceRetentionKey,
} from '../retention/retention-keys';
import { PaneLeaf, PaneNode, PaneTab, leafPath } from '../tree/pane-node';
import { findLeaf, leavesOf } from '../tree/pane-queries';
import { PaneTreeService } from '../tree/pane-tree.service';
import { UnsavedWork } from './unsaved-work';

@Component({
  selector: 'lw-draft-view',
  template: `<span data-testid="draft">{{ draft() }}</span>`,
})
class DraftView implements OnDestroy, DirtySurface {
  readonly draft = signal('');
  destroyed = false;
  surfaceBeforeClose?: () => boolean;

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
        />
      </div>
    }
  `,
})
class PanesHost {
  private readonly paneTree = inject(PaneTreeService);
  readonly component: Type<unknown> = DraftView;
  readonly injector = inject(Injector);
  readonly panes = computed(() =>
    Object.entries(this.paneTree.dockTrees()).flatMap(([dock, tree]) =>
      leavesOf(tree).flatMap((leaf) => {
        const path = leafPath(leaf);
        const scope = paneRetentionScope(dock, leaf.id);
        return path === undefined
          ? []
          : [{ scope, key: surfaceRetentionKey(scope, path) }];
      }),
    ),
  );
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

describe('a tab that changes panes asks first where the change would destroy unsaved work', () => {
  let paneTree: PaneTreeService;
  let stash: RetainedViewStash;

  beforeEach(() => {
    localStorage.clear();
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
    for (const path of ['notes', 'other', 'third']) {
      registry.addContentRoute({ path, component: DraftView });
    }
    paneTree = TestBed.inject(PaneTreeService);
    stash = TestBed.inject(RetainedViewStash);
    TestBed.inject(ParkedViewSweep).start();
  });

  async function drawn(tree: PaneNode): Promise<ComponentFixture<PanesHost>> {
    paneTree.commit('left', tree);
    const fixture = TestBed.createComponent(PanesHost);
    await settled(fixture);
    return fixture;
  }

  function shownAt(scope: string): DraftView {
    return (stash.instancesFor(scope, 'notes') as DraftView[])[0];
  }

  async function typedAt(
    fixture: ComponentFixture<PanesHost>,
    scope: string,
  ): Promise<DraftView> {
    const typed = shownAt(scope);
    typed.draft.set('typed');
    await settled(fixture);
    return typed;
  }

  function questions(): number {
    return TestBed.inject(DialogService).dialogs().length;
  }

  function answer(choice: 'discard' | 'cancel'): void {
    TestBed.inject(DialogService).dialogs().at(-1)?.ref.close(choice);
  }

  function tabsOf(paneId: string, dock = 'left'): string[] {
    return (findLeaf(paneTree.tree(dock), paneId)?.tabs ?? []).map(
      (tab) => tab.path,
    );
  }

  const twoPanes = () =>
    sideBySide(leaf('main', 'notes', 'other'), leaf('b', 'third'));

  describe('moved to the strip of another pane', () => {
    it('asks, and Cancel leaves the tab and its work where they were', async () => {
      const fixture = await drawn(twoPanes());
      const typed = await typedAt(fixture, 'left:main');

      TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
      await settled(fixture);

      expect(questions()).toBe(1);
      expect(tabsOf('main')).toEqual(['notes', 'other']);

      answer('cancel');
      await settled(fixture);

      expect(tabsOf('main')).toEqual(['notes', 'other']);
      expect(tabsOf('b')).toEqual(['third']);
      expect(typed.destroyed).toBe(false);
      expect(draftsShownIn(fixture, 'left:main')).toEqual(['typed']);
    });

    it('goes ahead once the work is given up, and the tab is built anew in its new pane', async () => {
      const fixture = await drawn(twoPanes());
      const typed = await typedAt(fixture, 'left:main');

      TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
      await settled(fixture);
      answer('discard');
      await settled(fixture);

      expect(tabsOf('main')).toEqual(['other']);
      expect(tabsOf('b')).toEqual(['third', 'notes']);
      expect(typed.destroyed).toBe(true);
      expect(draftsShownIn(fixture, 'left:b')).toEqual(['']);
    });

    it('asks nothing where the tab holds no unsaved work', async () => {
      const fixture = await drawn(twoPanes());

      TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
      await settled(fixture);

      expect(questions()).toBe(0);
      expect(tabsOf('b')).toEqual(['third', 'notes']);
    });

    it('asks a surface that may refuse its close even where it holds no unsaved work, and its refusal leaves the tab where it was', async () => {
      const fixture = await drawn(twoPanes());
      shownAt('left:main').surfaceBeforeClose = () => false;

      TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
      await settled(fixture);

      expect(questions()).toBe(0);
      expect(tabsOf('main')).toEqual(['notes', 'other']);
      expect(shownAt('left:main').destroyed).toBe(false);
    });
  });

  describe('every other way a tab changes panes', () => {
    it('asks when the tab is dropped on an edge', async () => {
      const fixture = await drawn(twoPanes());
      await typedAt(fixture, 'left:main');

      TestBed.inject(PaneMoveService).moveToEdge(
        { dock: 'left', paneId: 'main' },
        'notes',
        { dock: 'left', paneId: 'b' },
        'right',
      );
      await settled(fixture);

      expect(questions()).toBe(1);
      expect(tabsOf('main')).toEqual(['notes', 'other']);
    });

    it('asks when the tab is split out of its pane', async () => {
      const fixture = await drawn(twoPanes());
      await typedAt(fixture, 'left:main');

      TestBed.inject(PaneMoveService).splitTabOut('notes', 'row', {
        dock: 'left',
        paneId: 'main',
      });
      await settled(fixture);

      expect(questions()).toBe(1);
      expect(tabsOf('main')).toEqual(['notes', 'other']);
    });

    it('asks when the tab is moved to another dock', async () => {
      const fixture = await drawn(leaf('main', 'notes', 'other'));
      paneTree.commit('right', leaf('main', 'third'));
      await typedAt(fixture, 'left:main');

      TestBed.inject(PaneMoveService).moveToStrip(
        { dock: 'left', paneId: 'main' },
        'notes',
        { dock: 'right', paneId: 'main' },
      );
      await settled(fixture);

      expect(questions()).toBe(1);
      expect(tabsOf('main')).toEqual(['notes', 'other']);
      expect(tabsOf('main', 'right')).toEqual(['third']);
    });

    it('asks when the tab is dropped on a pane that already holds it', async () => {
      const fixture = await drawn(
        sideBySide(leaf('main', 'notes', 'other'), leaf('b', 'notes')),
      );
      await typedAt(fixture, 'left:main');

      TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
      await settled(fixture);

      expect(questions()).toBe(1);
      expect(tabsOf('main')).toEqual(['notes', 'other']);
    });

    it('asks nothing when tabs are only put in another order within their pane', async () => {
      const fixture = await drawn(twoPanes());
      await typedAt(fixture, 'left:main');
      const before = paneTree.dockTrees();

      paneTree.reorderPaneTabs('left', 'main', ['other', 'notes']);

      expect(
        TestBed.inject(UnsavedWork).lostBy(before, paneTree.dockTrees()),
      ).toEqual([]);
    });
  });

  describe('a move whose question was answered late', () => {
    async function asked(): Promise<ComponentFixture<PanesHost>> {
      const fixture = await drawn(twoPanes());
      await typedAt(fixture, 'left:main');
      TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
      await settled(fixture);
      expect(questions()).toBe(1);
      return fixture;
    }

    it('is abandoned, with the tab left where it is, when the pane it was going to is gone', async () => {
      const fixture = await asked();

      paneTree.closePane('left', 'b');
      answer('discard');
      await settled(fixture);

      expect(tabsOf('main')).toEqual(['notes', 'other']);
    });

    it('is abandoned when another workspace is shown', async () => {
      const fixture = await asked();

      TestBed.inject(ActiveWorkspaceService).set('elsewhere');
      answer('discard');
      await settled(fixture);

      expect(tabsOf('main')).toEqual(['notes', 'other']);
      expect(tabsOf('b')).toEqual(['third']);
    });

    it('is abandoned when the arrangement was replaced, though it is the same workspace', async () => {
      const fixture = await asked();

      paneTree.hydrate(paneTree.serialize());
      answer('discard');
      await settled(fixture);

      expect(tabsOf('main')).toEqual(['notes', 'other']);
    });

    it('is abandoned when the tab is no longer where it was', async () => {
      const fixture = await asked();

      paneTree.commit(
        'left',
        sideBySide(leaf('main', 'other'), leaf('b', 'third')),
      );
      answer('discard');
      await settled(fixture);

      expect(tabsOf('b')).toEqual(['third']);
    });

    it('is abandoned when it would by then destroy unsaved work that was not asked about', async () => {
      const fixture = await drawn(twoPanes());
      const child = createComponent(DraftView, {
        environmentInjector: TestBed.inject(EnvironmentInjector),
      });
      stash.acquire('container@notes:main|view:child|', DraftView, () => ({
        view: child.hostView as EmbeddedViewRef<unknown>,
        instance: child.instance,
      }));
      await typedAt(fixture, 'left:main');
      TestBed.inject(PaneActions).moveTab('notes', 'left', 'b');
      await settled(fixture);
      expect(questions()).toBe(1);

      child.instance.draft.set('typed while the question stood');
      answer('discard');
      await settled(fixture);

      expect(tabsOf('main')).toEqual(['notes', 'other']);
    });
  });

  describe('a pane closing with a tab that cannot close', () => {
    const fixedNotes: PaneTab = { path: 'notes', closable: false };
    const handingOver = () =>
      sideBySide(leaf('main', 'other'), leaf('b', fixedNotes));

    it('asks about that tab, since it is built anew in the pane that takes it', async () => {
      const fixture = await drawn(handingOver());
      const typed = await typedAt(fixture, 'left:b');

      TestBed.inject(PaneActions).close('left', 'b');
      await settled(fixture);

      expect(questions()).toBe(1);
      expect(paneTree.isSplit('left')).toBe(true);
      expect(typed.destroyed).toBe(false);
    });

    it('asks the same when the split is undone', async () => {
      const fixture = await drawn(handingOver());
      await typedAt(fixture, 'left:b');

      TestBed.inject(PaneActions).unsplit('left');
      await settled(fixture);

      expect(questions()).toBe(1);
      expect(paneTree.isSplit('left')).toBe(true);
    });

    it('hands the tab over without a question where it holds no unsaved work', async () => {
      const fixture = await drawn(handingOver());

      TestBed.inject(PaneActions).close('left', 'b');
      await settled(fixture);

      expect(questions()).toBe(0);
      expect(tabsOf('main')).toEqual(['other', 'notes']);
    });
  });
});
