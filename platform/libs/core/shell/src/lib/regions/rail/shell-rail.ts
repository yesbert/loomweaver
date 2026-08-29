import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { LayoutRegion, SHELL_LAYOUT } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { CommandService } from '../../commands/command.service';
import { AuthContext } from '../../auth/auth-context';
import { RailItem } from '../../foundation/rail-item';
import { ContextMenuDirective } from '../../menu/context-menu.directive';
import { RAIL_CONTEXT_MENU, RAIL_ITEM_CONTEXT_MENU } from './rail-context-menu';
import { RailItemsService } from './rail-items.service';
import { RailMoveService } from './rail-move.service';
import { Reorderable } from '../reorder/reorderable.directive';
import { UserOrderService } from '../reorder/user-order.service';
import { SHELL_FEATURES } from '../../foundation/shell-features';
import { ActiveWorkspaceService } from '../../workspace/active-workspace.service';
import { WorkspaceService } from '../../workspace/workspace.service';

@Component({
  selector: 'lw-shell-rail',
  imports: [
    TranslocoPipe,
    Reorderable,
    CdkDropList,
    CdkDrag,
    ContextMenuDirective,
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
  private readonly features = inject(SHELL_FEATURES).rail;
  private readonly activeWorkspace = inject(ActiveWorkspaceService);
  private readonly railItems = inject(RailItemsService);
  private readonly railMove = inject(RailMoveService);
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly workspaces = inject(WorkspaceService);

  protected readonly railMenu = this.features.curate ? [RAIL_CONTEXT_MENU] : [];

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
    this.region().dock === 'right' ? 'rail.labelRight' : 'rail.label',
  );
  protected readonly reorderable = this.features.reorder;

  protected readonly draggable =
    this.features.reorder || this.features.moveItems;

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
          item.workspace !== undefined || this.commands.triggerable(item),
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
    const bottom = this.userOrder.applyOrder(id, inRail.filter((item) => isBottom(item)), key);
    return [...top, ...bottom];
  });

  protected readonly firstBottomId = computed(
    () => this.items().find((item) => item.anchor === 'bottom')?.id,
  );

  protected readonly enterPredicate = (
    _drag: CdkDrag<string>,
    list: CdkDropList,
  ): boolean =>
    list.id === this.dropListId() ? this.reorderable : this.features.moveItems;

  protected disabled(item: RailItem): boolean {
    return this.auth.disabled(item.access);
  }

  protected menusFor(item: RailItem): readonly string[] {
    return item.menu
      ? [RAIL_ITEM_CONTEXT_MENU, item.menu]
      : [RAIL_ITEM_CONTEXT_MENU];
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

  private dockForChord(event: KeyboardEvent): 'left' | 'right' | null {
    if (!this.features.moveItems || !event.altKey || !event.shiftKey) {
      return null;
    }
    if (event.key === 'ArrowRight') {
      return 'right';
    }
    return event.key === 'ArrowLeft' ? 'left' : null;
  }
}
