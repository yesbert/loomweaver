import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  afterEveryRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { LayoutRegion, SHELL_LAYOUT } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { CommandService } from '../../commands/command.service';
import { AuthContext } from '../../auth/auth-context';
import { RailItem } from '../../foundation/rail-item';
import { MenuTriggerDirective } from '../../menu/menu-trigger.directive';
import {
  menuOnActivate,
  menuOnContext,
  warnMenuTriggerConflict,
} from '../../menu/chrome-item-menu';
import { MenuSide } from '../../elements/menu/lw-menu.element';
import { RAIL_CONTEXT_MENU, RAIL_ITEM_CONTEXT_MENU } from './rail-context-menu';
import { RailItemsService } from './rail-items.service';
import { RailMoveService } from './rail-move.service';
import { Reorderable } from '../reorder/reorderable.directive';
import { UserOrderService } from '../reorder/user-order.service';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { ActiveWorkspaceService } from '../../workspace/active-workspace.service';
import { WorkspaceService } from '../../workspace/workspace.service';
import { RailLabelsService } from './rail-labels.service';
import { sameIds, shortenedLabelIds } from './rail-label-fit';
import { railNameKey } from './rail-name';

@Component({
  selector: 'lw-shell-rail',
  imports: [
    NgTemplateOutlet,
    TranslocoPipe,
    Reorderable,
    CdkDropList,
    CdkDrag,
    CdkScrollable,
    MenuTriggerDirective,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './shell-rail.html',
})
export class ShellRail {
  readonly region = input.required<LayoutRegion>();

  private readonly registry = inject(ContributionRegistry);
  private readonly commands = inject(CommandService);
  private readonly auth = inject(AuthContext);
  private readonly userOrder = inject(UserOrderService);
  private readonly features = inject(FeatureSwitches).rail;
  private readonly activeWorkspace = inject(ActiveWorkspaceService);
  private readonly railItems = inject(RailItemsService);
  private readonly railMove = inject(RailMoveService);
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly workspaces = inject(WorkspaceService);
  private readonly railLabels = inject(RailLabelsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly shortenedIds = signal<ReadonlySet<string>>(new Set());

  protected readonly railMenu = computed(() =>
    this.features.curate() ? [RAIL_CONTEXT_MENU] : [],
  );

  protected readonly containerId = computed(() => `rail:${this.region().id}`);
  protected readonly dropListId = computed(
    () => `rail-items-${this.region().id}`,
  );
  protected readonly connectedRails = computed(() =>
    this.layout.regions
      .filter(
        (region) => region.type === 'rail' && region.id !== this.region().id,
      )
      .map((region) => `rail-items-${region.id}`),
  );
  protected readonly labelKey = computed(() =>
    railNameKey(this.region(), this.layout),
  );
  protected readonly menuSide = computed<MenuSide>(() =>
    this.region().dock === 'right' ? 'left' : 'right',
  );
  protected readonly reorderable = computed(() => this.features.reorder());
  protected readonly labelled = computed(() =>
    this.railLabels.labelled(this.region().id),
  );

  protected readonly draggable = computed(
    () => this.features.reorder() || this.features.moveItems(),
  );

  private readonly registered = computed(() =>
    this.registry
      .railItems()
      .filter(
        (item) =>
          this.railItems.regionOf(item.id, item.rail) === this.region().id,
      )
      .filter((item) => this.auth.visible(item.access))
      .filter(
        (item) =>
          item.workspace !== undefined ||
          menuOnActivate(item) !== undefined ||
          this.commands.triggerable(item),
      )
      .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  );

  protected readonly items = computed(() => {
    const inRail = this.registered().filter((item) =>
      this.railItems.isVisible(item.id),
    );
    const isBottom = (item: RailItem) => item.anchor === 'bottom';
    const id = this.containerId();
    const key = (item: RailItem) => item.id;
    const top = this.userOrder.applyOrder(
      id,
      inRail.filter((item) => !isBottom(item)),
      key,
    );
    const bottom = this.userOrder.applyOrder(
      id,
      inRail.filter((item) => isBottom(item)),
      key,
    );
    return [...top, ...bottom];
  });

  protected readonly topItems = computed(() =>
    this.items().filter((item) => item.anchor !== 'bottom'),
  );

  protected readonly bottomItems = computed(() =>
    this.items().filter((item) => item.anchor === 'bottom'),
  );

  private readonly brokenPictures = signal<ReadonlySet<string>>(new Set());

  constructor() {
    afterEveryRender(() => this.measureShortened());
    this.observeResize();
  }

  protected readonly enterPredicate = (
    _drag: CdkDrag<string>,
    list: CdkDropList,
  ): boolean =>
    list.id === this.dropListId()
      ? this.reorderable()
      : this.features.moveItems();

  protected shortened(itemId: string): boolean {
    return this.shortenedIds().has(itemId);
  }

  protected pictureOf(item: RailItem): string | undefined {
    return this.brokenPictures().has(item.id) ? undefined : item.image;
  }

  protected onPictureError(item: RailItem): void {
    this.brokenPictures.update((broken) => new Set(broken).add(item.id));
  }

  protected disabled(item: RailItem): boolean {
    return this.auth.disabled(item.access);
  }

  protected menusFor(item: RailItem): readonly string[] {
    const own = menuOnContext(item);
    return own ? [RAIL_ITEM_CONTEXT_MENU, own] : [RAIL_ITEM_CONTEXT_MENU];
  }

  protected activateMenuFor(item: RailItem): string | undefined {
    return menuOnActivate(item);
  }

  protected onFocus(event: FocusEvent): void {
    (event.target as HTMLElement | null)?.scrollIntoView({ block: 'nearest' });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const dock = this.dockForChord(event);
    if (dock === null) {
      return;
    }
    const itemId = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-rail-item]',
    )?.dataset['railItem'];
    const target = this.railMove.railOn(dock, this.region().id);
    if (!itemId || !target) {
      return;
    }
    event.preventDefault();
    this.railMove.move(itemId, target);
  }

  protected current(item: RailItem): boolean {
    return (
      item.workspace !== undefined &&
      item.workspace === this.activeWorkspace.id()
    );
  }

  protected run(item: RailItem): void {
    if (this.disabled(item)) return;
    warnMenuTriggerConflict(item);
    if (menuOnActivate(item)) {
      return;
    }
    const workspace = item.workspace;
    if (workspace !== undefined) {
      void this.workspaces.switchTo(workspace);
      return;
    }
    this.commands.trigger(item);
  }

  protected onReorder(ids: string[]): void {
    this.userOrder.setOrder(this.containerId(), ids);
  }

  protected onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousContainer !== event.container) {
      this.railMove.move(String(event.item.data), this.region().id);
      return;
    }
    const items = [...this.items()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.onReorder(items.map((item) => item.id));
  }

  protected readonly sortPredicate = (
    index: number,
    drag: CdkDrag<string>,
  ): boolean => {
    const items = this.items();
    const dragged = items.find((item) => item.id === drag.data);
    const target = items[index];
    return (
      !!dragged &&
      !!target &&
      (dragged.anchor ?? 'top') === (target.anchor ?? 'top')
    );
  };

  private measureShortened(): void {
    const shortened = shortenedLabelIds(this.host.nativeElement);
    if (!sameIds(shortened, this.shortenedIds())) {
      this.shortenedIds.set(shortened);
    }
  }

  private observeResize(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => this.measureShortened());
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private dockForChord(event: KeyboardEvent): 'left' | 'right' | null {
    if (!this.features.moveItems() || !event.altKey || !event.shiftKey) {
      return null;
    }
    if (event.key === 'ArrowRight') {
      return 'right';
    }
    return event.key === 'ArrowLeft' ? 'left' : null;
  }
}
