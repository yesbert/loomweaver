import { Component, computed, effect, inject, input } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { SHELL_FEATURES } from '../../../foundation/shell-features';
import { PaneDragService } from './pane-drag.service';
import { isContainerDock } from '../container/container-children';
import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../tree/pane-address';
import { PaneTreeService } from '../tree/pane-tree.service';
import { findLeaf } from '../tree/pane-queries';
import {
  PaneDropEdge,
  PaneMoveService,
  stripSourceOf,
} from './pane-move.service';

@Component({
  selector: 'lw-pane-drop-zones',
  imports: [CdkDropList],
  host: {
    class: 'absolute inset-0 z-20 grid transition-opacity',
    '[class.opacity-0]': '!active()',
    '[class.pointer-events-none]': '!active()',
    '[style.grid-template-columns]': '"1fr 2fr 1fr"',
    '[style.grid-template-rows]': '"1fr 2fr 1fr"',
    '[attr.aria-hidden]': 'true',
  },
  templateUrl: './pane-drop-zones.html',
})
export class PaneDropZones {
  readonly dock = input.required<string>();
  readonly paneId = input.required<string>();

  private readonly drag = inject(PaneDragService);
  private readonly features = inject(SHELL_FEATURES).content;
  private readonly sidebar = inject(SHELL_FEATURES).sidebar;

  private readonly contentSide = computed(
    () => this.dock() === CONTENT_DOCK || isContainerDock(this.dock()),
  );
  private readonly paneMove = inject(PaneMoveService);
  private readonly paneTree = inject(PaneTreeService);

  protected readonly active = computed(() => this.drag.dragging() !== null);

  protected readonly fills = computed(
    () =>
      findLeaf(this.paneTree.tree(this.dock()), this.paneId())?.tabs.length ===
      0,
  );

  protected readonly edges = computed<readonly PaneDropEdge[]>(() => {
    if (!this.contentSide()) {
      return this.sidebar.stackViews || this.sidebar.acceptTabs
        ? ['top', 'bottom', 'left', 'right']
        : [];
    }
    return [
      ...(this.features.splitDown ? (['top', 'bottom'] as const) : []),
      ...(this.features.splitRight ? (['left', 'right'] as const) : []),
    ];
  });

  protected readonly accepts = computed(() =>
    this.contentSide()
      ? this.features.moveTabs
      : this.sidebar.moveViews || this.sidebar.acceptTabs,
  );

  constructor() {
    effect((onCleanup) => {
      const disposers = this.zoneIds().map((id) => this.drag.registerZone(id));
      onCleanup(() => disposers.forEach((dispose) => dispose()));
    });
  }

  protected has(edge: PaneDropEdge): boolean {
    return this.edges().includes(edge);
  }

  protected readonly enterPredicate = (drag: CdkDrag<string>): boolean => {
    if (this.contentSide()) {
      return true;
    }
    if (!String(drag.data ?? '').startsWith(VIEW_PANE_PREFIX)) {
      return this.sidebar.acceptTabs;
    }
    return this.fills() ? this.sidebar.moveViews : this.sidebar.stackViews;
  };

  protected zoneId(edge: PaneDropEdge): string {
    return `pane-zone:${this.dock()}:${this.paneId()}:${edge}`;
  }

  protected fillZoneId(): string {
    return `pane-zone:${this.dock()}:${this.paneId()}:fill`;
  }

  protected onFill(event: CdkDragDrop<unknown>): void {
    const source = stripSourceOf(event.previousContainer.id);
    if (source) {
      this.paneMove.moveToStrip(source, String(event.item.data ?? ''), {
        dock: this.dock(),
        paneId: this.paneId(),
      });
    }
  }

  protected onDrop(edge: PaneDropEdge, event: CdkDragDrop<unknown>): void {
    const source = stripSourceOf(event.previousContainer.id);
    if (source) {
      this.paneMove.moveToEdge(
        source,
        String(event.item.data ?? ''),
        { dock: this.dock(), paneId: this.paneId() },
        edge,
      );
    }
  }

  private zoneIds(): string[] {
    if (!this.fills()) {
      return this.edges().map((edge) => this.zoneId(edge));
    }
    return this.accepts() ? [this.fillZoneId()] : [];
  }
}
