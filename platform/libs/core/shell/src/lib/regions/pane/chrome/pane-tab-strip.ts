import { afterNextRender, afterRenderEffect, Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, ElementRef, TemplateRef, computed, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
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
import { VIEW_PANE_PREFIX } from '../tree/pane-address';
import { resolveTitle } from '../drag/pane-label';
import { SHELL_FEATURES } from '../../../foundation/shell-features';
import { PaneDragService, TabDragSource } from '../drag/pane-drag.service';
import { PaneMoveService, stripIdOf, stripSourceOf } from '../drag/pane-move.service';
import { StripTab, TabAcceptance } from './strip-tab';

const EDGE_TOLERANCE_PX = 1;

@Component({
  selector: 'lw-pane-tab-strip',
  imports: [
    NgTemplateOutlet,
    TranslocoPipe,
    MenuTriggerDirective,
    Reorderable,
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

  readonly source = input.required<TabDragSource>();

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

  private readonly transloco = inject(TranslocoService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly paneDrag = inject(PaneDragService);

  private readonly paneMove = inject(PaneMoveService);

  private readonly strip = viewChild<ElementRef<HTMLElement>>('tabStrip');

  protected readonly escalatable = inject(SHELL_FEATURES).content.escalate;

  private pickedHere: string | null = null;

  protected readonly overflowing = signal(false);

  protected readonly stripId = computed(() => stripIdOf(this.source()));

  protected readonly dragZoneIds = computed(() =>
    this.paneDrag.dropTargetIds().filter((id) => id !== this.stripId()),
  );

  protected readonly activeActions = computed(
    () =>
      this.tabs().find((tab) => tab.path === this.activeId())?.actions ?? [],
  );

  protected readonly icons = computed(() => this.variant() === 'icons');

  protected readonly bandClass = computed(() =>
    this.icons()
      ? 'relative z-30 flex h-full items-center border-b border-border bg-surface px-1'
      : 'relative z-30 flex h-full items-stretch border-b border-border bg-surface',
  );

  constructor() {
    afterRenderEffect(() => {
      this.tabs();
      if (this.overflow()) {
        this.measureOverflow();
      }
    });
    afterNextRender(() => this.observeResize());
    afterRenderEffect(() => {
      const active = this.activeId();
      const picked = this.pickedHere;
      this.pickedHere = null;
      if (picked !== active && this.overflow()) {
        this.revealActiveTab();
      }
    });
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
      label: this.label(tab),
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
    if (tab.path !== this.activeId()) {
      this.pickedHere = tab.path;
    }
    this.selectTab.emit(tab);
  }

  protected isActive(tab: StripTab): boolean {
    return this.activeId() === tab.path;
  }

  protected menuSlotFor(tab: StripTab): string {
    return tab.path.startsWith(VIEW_PANE_PREFIX)
      ? this.viewContextMenuSlot()
      : this.contextMenuSlot();
  }

  protected tabContext(tab: StripTab): MenuContext {
    if (tab.path.startsWith(VIEW_PANE_PREFIX)) {
      return {
        targetKind: 'view-tab',
        viewId: tab.path.slice(VIEW_PANE_PREFIX.length),
        region: this.contextGroup(),
        ...(tab.instance && { instance: tab.instance }),
      };
    }
    return {
      targetKind: 'content-tab',
      tabId: tab.path,
      group: this.contextGroup(),
      pinned: tab.pinned,
      closable: tab.closable,
    };
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

  protected canReorder(tab: StripTab): boolean {
    return this.reorderable() && (tab.closable || tab.pinned);
  }

  protected canDrag(tab: StripTab): boolean {
    return this.draggable() && (tab.closable || tab.pinned);
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
      tabs.filter((tab) => this.canReorder(tab)).map((tab) => tab.path),
    );
  }

  private observeResize(): void {
    const element = this.strip()?.nativeElement;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(
      () => this.overflow() && this.measureOverflow(),
    );
    observer.observe(element);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private measureOverflow(): void {
    const element = this.strip()?.nativeElement;
    this.overflowing.set(
      !!element && element.scrollWidth - element.clientWidth > EDGE_TOLERANCE_PX,
    );
  }

  private revealActiveTab(): void {
    const strip = this.strip()?.nativeElement;
    const active = this.activeId();
    const wrapper = strip?.querySelector<HTMLElement>(
      `[data-tab-path="${CSS.escape(active)}"]`,
    )?.parentElement;
    if (!strip || !wrapper) {
      return;
    }
    const band = strip.getBoundingClientRect();
    const tab = wrapper.getBoundingClientRect();
    const fullyVisible =
      tab.left >= band.left - EDGE_TOLERANCE_PX &&
      tab.right <= band.right + EDGE_TOLERANCE_PX;
    if (!fullyVisible) {
      this.revealRequest.emit(active);
    }
  }

  private bandOf(tab: StripTab): string {
    if (tab.pinned) {
      return 'pinned';
    }
    return tab.closable ? 'dynamic' : 'static';
  }

  private label(tab: StripTab): string {
    return resolveTitle(tab, (key) => this.transloco.translate(key));
  }
}
