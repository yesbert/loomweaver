import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { MenuContext, ViewAction } from '@loomweaver/plugin-sdk';
import { MENU_ANCHOR_GAP, MenuService } from '../../../menu/menu.service';
import { MenuTriggerDirective } from '../../../menu/menu-trigger.directive';
import { Reorderable } from '../../reorder/reorderable.directive';
import { isViewPanePath, PaneRef } from '../tree/pane-address';
import { paneRetentionScope } from '../retention/retention-keys';
import { UnsavedWork } from '../unsaved-work/unsaved-work';
import { resolveTitle } from './tab-label';
import { FeatureSwitches } from '../../../features/feature-switches.service';
import { PaneDragService } from '../drag/pane-drag.service';
import {
  PaneMoveService,
  stripIdOf,
  stripSourceOf,
} from '../drag/pane-move.service';
import { RovingTabs } from './roving-tabs.directive';
import { StripOverflow } from './strip-overflow.directive';
import { StripTab, TabAcceptance, tabMenuContext } from './strip-tab';

@Component({
  selector: 'lw-pane-tab-strip',
  imports: [
    NgTemplateOutlet,
    TranslocoPipe,
    MenuTriggerDirective,
    Reorderable,
    RovingTabs,
    StripOverflow,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './pane-tab-strip.html',
})
export class PaneTabStrip {
  readonly tabs = input.required<readonly StripTab[]>();

  readonly activeId = input.required<string>();

  readonly reorderable = input(false);

  readonly draggable = input(false);

  readonly acceptsTabs = input<TabAcceptance>(false);

  readonly source = input.required<PaneRef>();

  readonly variant = input<'titles' | 'icons'>('titles');

  readonly urlDriven = input(false);

  readonly contextMenuSlot = input('');

  readonly viewContextMenuSlot = input('');

  readonly contextGroup = input('');

  readonly overflow = input(false);

  readonly canAddTab = input(false);

  readonly paneActions = input<TemplateRef<unknown> | null>(null);

  readonly selectTab = output<StripTab>();

  readonly escalate = output<StripTab>();

  readonly closeTab = output<StripTab>();

  readonly unpinTab = output<StripTab>();

  readonly reorderTabs = output<string[]>();

  readonly runAction = output<ViewAction>();

  readonly addTab = output<Event>();

  readonly revealRequest = output<string>();

  private readonly menu = inject(MenuService);

  private readonly paneDrag = inject(PaneDragService);

  private readonly paneMove = inject(PaneMoveService);

  private readonly unsavedWork = inject(UnsavedWork);

  private readonly stripOverflow = viewChild.required(StripOverflow);

  protected readonly escalatable = inject(FeatureSwitches).content.escalate;

  protected readonly stripId = computed(() => stripIdOf(this.source()));

  protected readonly dragZoneIds = computed(() =>
    this.paneDrag.dropTargetIds().filter((id) => id !== this.stripId()),
  );

  protected readonly activeActions = computed(
    () =>
      this.tabs().find((tab) => tab.path === this.activeId())?.actions ?? [],
  );

  protected readonly icons = computed(() => this.variant() === 'icons');

  private readonly retentionScope = computed(() =>
    paneRetentionScope(this.source().dock, this.source().paneId),
  );

  private readonly unsavedPaths = computed(() => {
    const scope = this.retentionScope();
    return new Set(
      this.tabs()
        .filter((tab) => this.unsavedWork.at(scope, tab.path))
        .map((tab) => tab.path),
    );
  });

  protected readonly bandClass = computed(() =>
    this.icons()
      ? 'relative z-30 flex h-full items-center border-b border-border bg-surface px-1'
      : 'relative z-30 flex h-full items-stretch border-b border-border bg-surface',
  );

  constructor() {
    effect((onCleanup) => {
      const id = this.stripId();
      if (!id) {
        return;
      }
      onCleanup(this.paneDrag.registerStrip(id));
    });
  }

  protected readonly sortPredicate = (
    index: number,
    drag: CdkDrag<string>,
  ): boolean => {
    const tabs = this.tabs();
    const dragged = tabs.find((tab) => tab.path === drag.data);
    if (!dragged) {
      return true;
    }
    const target = tabs[index];
    return !!target && this.bandOf(dragged) === this.bandOf(target);
  };

  protected onDragStarted(tab: StripTab): void {
    this.paneDrag.start(tab.path);
  }

  protected onDragEnded(): void {
    this.paneDrag.stop();
  }

  protected openOverflow(event: Event): void {
    const control = event.currentTarget as HTMLElement;
    const anchor = control.getBoundingClientRect();
    const entries = this.tabs().map((tab) => ({
      key: tab.path,
      label: (translate: (key: string) => string) =>
        resolveTitle(tab, translate),
      icon: tab.icon,
      active: this.isActive(tab),
    }));
    this.menu.openList(
      entries,
      { x: anchor.right, y: anchor.bottom + MENU_ANCHOR_GAP },
      (path) => {
        const tab = this.tabs().find((candidate) => candidate.path === path);
        if (tab) {
          this.selectTab.emit(tab);
        }
      },
      control,
    );
  }

  protected onSelectTab(tab: StripTab): void {
    this.stripOverflow().notePicked(tab.path);
    this.selectTab.emit(tab);
  }

  protected unsaved(tab: StripTab): boolean {
    return this.unsavedPaths().has(tab.path);
  }

  protected closeControlClass(tab: StripTab): string {
    const base =
      'lw-icon-btn absolute inset-0 cursor-pointer opacity-70 hover:opacity-100';
    return this.unsaved(tab)
      ? `${base} pointer-fine:hidden pointer-fine:group-hover/mark:flex`
      : base;
  }

  protected isActive(tab: StripTab): boolean {
    return this.activeId() === tab.path;
  }

  protected menuSlotFor(tab: StripTab): string {
    return isViewPanePath(tab.path)
      ? this.viewContextMenuSlot()
      : this.contextMenuSlot();
  }

  protected tabContext(tab: StripTab): MenuContext {
    return tabMenuContext(tab, {
      group: this.contextGroup(),
      paneId: this.source().paneId,
      primary: this.urlDriven(),
      sole: this.tabs().length === 1,
    });
  }

  protected onTabKeydown(event: KeyboardEvent, tab: StripTab): void {
    if (event.key !== 'Delete' || !tab.closable || tab.pinned) {
      return;
    }
    event.preventDefault();
    this.closeTab.emit(tab);
  }

  protected onClose(event: Event, tab: StripTab): void {
    event.stopPropagation();
    this.closeTab.emit(tab);
  }

  protected onUnpin(event: Event, tab: StripTab): void {
    event.stopPropagation();
    this.unpinTab.emit(tab);
  }

  protected bandOf(tab: StripTab): string {
    return tab.pinned ? 'pinned' : 'dynamic';
  }

  protected canReorder(tab: StripTab): boolean {
    return this.reorderable() && tab.movable;
  }

  protected canDrag(tab: StripTab): boolean {
    return this.draggable() && tab.movable;
  }

  protected readonly enterPredicate = (drag: CdkDrag<string>): boolean => {
    if (drag.dropContainer.id === this.stripId()) {
      return this.reorderable();
    }
    const accepts = this.acceptsTabs();
    return typeof accepts === 'function'
      ? accepts(String(drag.data ?? ''))
      : accepts;
  };

  protected onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousContainer !== event.container) {
      const source = stripSourceOf(event.previousContainer.id);
      if (source) {
        this.paneMove.moveToStrip(
          source,
          String(event.item.data ?? ''),
          this.source(),
          event.currentIndex,
        );
      }
      return;
    }
    const tabs = [...this.tabs()];
    moveItemInArray(tabs, event.previousIndex, event.currentIndex);
    this.reorderTabs.emit(
      tabs.filter((tab) => tab.movable).map((tab) => tab.path),
    );
  }
}
