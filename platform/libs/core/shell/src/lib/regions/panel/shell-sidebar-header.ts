import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LayoutRegion, SHELL_LAYOUT } from '../../layout/layout';
import { LoomIconName } from '../../elements/icon/loom-icons';
import { ViewportService } from '../../layout/viewport.service';
import { PanelState } from './panel-state';
import { PanelGroupService } from './panel-group.service';
import {
  PANEL_STRIP_CONTEXT_MENU,
  VIEW_CONTEXT_MENU,
} from './view-context-menu';
import { VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { TabDragSource } from '../pane/drag/pane-drag.service';
import { PaneMoveService, stripIdOf } from '../pane/drag/pane-move.service';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { PaneTabStrip } from '../pane/chrome/pane-tab-strip';
import { StripTab } from '../pane/chrome/strip-tab';
import { MenuTriggerDirective } from '../../menu/menu-trigger.directive';
import { toStripTab } from '../pane/drag/pane-label';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { FeatureSwitches } from '../../features/feature-switches.service';

export type SidebarHeaderContext = 'edge' | 'drawer' | 'floating';

@Component({
  selector: 'lw-shell-sidebar-header',
  imports: [TranslocoPipe, PaneTabStrip, MenuTriggerDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './shell-sidebar-header.html',
})
export class ShellSidebarHeader {
  readonly region = input.required<LayoutRegion>();
  readonly context = input<SidebarHeaderContext>('edge');

  private readonly panels = inject(PanelState);
  protected readonly viewport = inject(ViewportService);
  private readonly panelGroup = inject(PanelGroupService);
  private readonly paneTree = inject(PaneTreeService);
  private readonly paneMove = inject(PaneMoveService);
  private readonly registry = inject(ContributionRegistry);
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly features = inject(FeatureSwitches).sidebar;

  protected readonly viewContextMenu = VIEW_CONTEXT_MENU;

  protected readonly stripMenu = computed(() =>
    this.features.curate() ? [PANEL_STRIP_CONTEXT_MENU] : [],
  );

  protected readonly viewsReorderable = computed(() =>
    this.features.reorderViews(),
  );

  protected readonly viewsDraggable = computed(
    () => this.features.reorderViews() || this.features.moveViews(),
  );

  protected readonly canCollapse = computed(
    () => this.viewport.compact() || this.features.collapse(),
  );

  protected readonly source = computed<TabDragSource>(() => ({
    dock: this.region().id,
    paneId: this.paneTree.primaryId(this.region().id),
  }));

  protected readonly stripId = computed(() => stripIdOf(this.source()));

  protected readonly hostId = computed(() => `panel-views-${this.region().id}`);

  protected readonly stripTabs = computed<StripTab[]>(() =>
    this.panelGroup
      .tabs(this.region().id)
      .map((tab) => toStripTab(this.registry, tab)),
  );

  protected readonly activeTabPath = computed(
    () => this.panelGroup.activePath(this.region().id) ?? '',
  );

  protected readonly showHamburger = computed(
    () => this.viewport.compact() && this.context() === 'edge',
  );

  protected readonly collapsed = computed(
    () => !this.viewport.compact() && this.panels.isCollapsed(this.region().id),
  );

  protected readonly showExpand = computed(() => this.context() === 'floating');

  protected readonly collapseIcon = computed<LoomIconName>(() =>
    this.region().dock === 'right' ? 'chevronsRight' : 'chevronsLeft',
  );
  protected readonly expandIcon = computed<LoomIconName>(() =>
    this.region().dock === 'right' ? 'chevronsLeft' : 'chevronsRight',
  );

  protected readonly acceptsTab = (path: string): boolean =>
    path.startsWith(VIEW_PANE_PREFIX)
      ? this.features.moveViews()
      : this.features.acceptTabs();

  protected select(tab: StripTab): void {
    this.panelGroup.select(this.region().id, tab.path);
  }

  protected open(): void {
    this.panels.openOverlay(this.region().id);
  }

  protected trailingAction(): void {
    if (this.viewport.compact()) {
      this.panels.closeOverlay();
    } else {
      this.panels.toggle(this.region().id);
    }
  }

  protected expand(): void {
    this.panels.expand(this.region().id);
  }

  protected onReorder(order: string[]): void {
    this.paneTree.reorderPaneTabs(
      this.region().id,
      this.paneTree.primaryId(this.region().id),
      order,
    );
  }

  protected onStripKeydown(event: KeyboardEvent): void {
    const dock = this.dockForChord(event);
    if (dock === null) {
      return;
    }
    const path = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-tab-path]',
    )?.dataset['tabPath'];
    const target = this.targetPanelOn(dock);
    if (!path || !target) {
      return;
    }
    event.preventDefault();
    this.paneMove.moveToStrip(this.source(), path, {
      dock: target.id,
      paneId: this.paneTree.primaryId(target.id),
    });
    this.panels.expand(target.id);
  }

  private dockForChord(event: KeyboardEvent): 'left' | 'right' | null {
    if (!this.features.moveViews() || !event.altKey || !event.shiftKey) {
      return null;
    }
    if (event.key === 'ArrowRight') {
      return 'right';
    }
    return event.key === 'ArrowLeft' ? 'left' : null;
  }

  private targetPanelOn(dock: 'left' | 'right'): LayoutRegion | undefined {
    return this.layout.regions.find(
      (r) => r.type === 'panel' && r.dock === dock && r.id !== this.region().id,
    );
  }
}
