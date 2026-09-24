import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
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
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { CommandService } from '../../commands/command.service';
import { AuthContext } from '../../auth/auth-context';
import { RailItem } from '../../foundation/rail-item';
import { MenuTriggerDirective } from '../../menu/menu-trigger.directive';
import {
  isOffered,
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
import { WorkspaceService } from '../../workspace/workspace.service';
import { RailLabelsService } from './rail-labels.service';
import { RailLabelFit } from './rail-label-fit';
import { RailWorkspaceEntries } from './rail-workspace-entries';
import { bandOf, railEntries } from './rail-entries';
import { railNameKey } from './rail-name';
import { sideForMoveChord } from '../reorder/move-chord';

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
  hostDirectives: [RailLabelFit],
})
export class ShellRail {
  readonly region = input.required<LayoutRegion>();

  private readonly registry = inject(ContributionRegistry);
  private readonly commands = inject(CommandService);
  private readonly auth = inject(AuthContext);
  private readonly userOrder = inject(UserOrderService);
  private readonly features = inject(FeatureSwitches).rail;
  private readonly railItems = inject(RailItemsService);
  private readonly railMove = inject(RailMoveService);
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly workspaces = inject(WorkspaceService);
  private readonly workspaceEntries = inject(RailWorkspaceEntries);
  private readonly railLabels = inject(RailLabelsService);
  protected readonly labelFit = inject(RailLabelFit);

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
  protected readonly isLabelled = computed(() =>
    this.railLabels.isLabelled(this.region().id),
  );

  protected readonly draggable = computed(
    () => this.features.reorder() || this.features.moveItems(),
  );

  protected readonly entries = computed(() =>
    railEntries(
      this.registry.railItems().filter((item) => this.isShownHere(item)),
      (band) =>
        this.userOrder.applyOrder(this.containerId(), band, (item) => item.id),
    ),
  );

  private readonly items = computed(() => {
    const { top, bottom } = this.entries();
    return [...top, ...bottom];
  });

  private readonly brokenPictures = signal<ReadonlySet<string>>(new Set());

  protected readonly enterPredicate = (
    _drag: CdkDrag<string>,
    list: CdkDropList,
  ): boolean =>
    list.id === this.dropListId()
      ? this.reorderable()
      : this.features.moveItems();

  protected pictureOf(item: RailItem): string | undefined {
    return this.brokenPictures().has(item.id) ? undefined : item.image;
  }

  protected onPictureError(item: RailItem): void {
    this.brokenPictures.update((broken) => new Set(broken).add(item.id));
  }

  protected isDisabled(item: RailItem): boolean {
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
    const side = this.features.moveItems() ? sideForMoveChord(event) : null;
    if (side === null) {
      return;
    }
    const itemId = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-rail-item]',
    )?.dataset['railItem'];
    const target = this.railMove.railOn(side, this.region().id);
    if (!itemId || !target) {
      return;
    }
    event.preventDefault();
    this.railMove.move(itemId, target);
  }

  protected isCurrent(item: RailItem): boolean {
    return this.workspaceEntries.isCurrent(item);
  }

  protected run(item: RailItem): void {
    if (this.isDisabled(item)) return;
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
    return !!dragged && !!target && bandOf(dragged) === bandOf(target);
  };

  private isShownHere(item: RailItem): boolean {
    return (
      this.railItems.regionOf(item.id, item.rail) === this.region().id &&
      this.auth.visible(item.access) &&
      isOffered(item, (offered) => this.commands.triggerable(offered)) &&
      this.railItems.isVisible(item.id)
    );
  }
}
