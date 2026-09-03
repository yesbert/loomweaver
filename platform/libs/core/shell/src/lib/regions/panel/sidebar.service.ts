import { computed, inject, Service, Signal } from '@angular/core';
import { SHELL_LAYOUT } from '../../layout/layout';
import { HiddenViewsService } from './hidden-views.service';
import { PanelSizeService } from './panel-size.service';
import { PanelState } from './panel-state';
import { ViewVisibilityService } from './view-visibility.service';

/** What the workbench knows about one declared sidebar, as facts. */
export interface SidebarFacts {
  /** The region id the distribution declared for this panel. */
  readonly regionId: string;
  /** Whether the panel is collapsed. */
  readonly collapsed: boolean;
  /** The panel's width in pixels, as the user or the distribution last set it. */
  readonly width: number;
}

/**
 * The sidebars for a distribution: what the sidebar header, the splitter and the view menu do,
 * reachable from your own code by the ids you declared, plus the sidebars as facts.
 *
 * ```ts
 * const sidebars = inject(SidebarService);
 * sidebars.regions();                   // SidebarFacts[] for every declared panel
 * sidebars.isCollapsed('primary');      // reactive where it is read
 * sidebars.collapse('primary');         // as from the header
 * sidebars.setWidth('primary', 320);    // clamped to the usable range and remembered
 * sidebars.hideView('outline');         // asks about unsaved work like the view menu
 * ```
 *
 * Every action is the same code the control runs. A region id no declared panel carries does
 * nothing. The capability switches do not reach this service: what a distribution switched off for
 * its users it can still do from here.
 */
@Service()
export class SidebarService {
  private readonly panels = inject(PanelState);
  private readonly sizes = inject(PanelSizeService);
  private readonly visibility = inject(ViewVisibilityService);
  private readonly hidden = inject(HiddenViewsService);
  private readonly panelRegions = inject(SHELL_LAYOUT)
    .regions.filter((region) => region.type === 'panel')
    .map((region) => region.id);

  /** Every declared sidebar, in layout order. */
  readonly regions: Signal<readonly SidebarFacts[]> = computed(() =>
    this.panelRegions.map((regionId) => ({
      regionId,
      collapsed: this.panels.isCollapsed(regionId),
      width: this.sizes.width(regionId),
    })),
  );

  /** The ids of the views the user or the distribution hid. */
  readonly hiddenViews: Signal<readonly string[]> = computed(() => [
    ...this.hidden.hidden(),
  ]);

  /** Whether the panel is collapsed; reactive where it is read. */
  isCollapsed(regionId: string): boolean {
    return this.panels.isCollapsed(regionId);
  }

  /** The panel's width in pixels; reactive where it is read. */
  width(regionId: string): number {
    return this.sizes.width(regionId);
  }

  /** Collapses the panel, as its header would. */
  collapse(regionId: string): void {
    if (this.declared(regionId) && !this.panels.isCollapsed(regionId)) {
      this.panels.toggle(regionId);
    }
  }

  /** Expands the panel, as its header would. */
  expand(regionId: string): void {
    if (this.declared(regionId)) {
      this.panels.expand(regionId);
    }
  }

  /** Collapses an expanded panel and expands a collapsed one. */
  toggle(regionId: string): void {
    if (this.declared(regionId)) {
      this.panels.toggle(regionId);
    }
  }

  /** Sets the panel's width, brought into the usable range and remembered like a released drag. */
  setWidth(regionId: string, px: number): void {
    if (!this.declared(regionId)) {
      return;
    }
    this.sizes.setWidth(regionId, px);
    this.sizes.commit();
  }

  /** Hides a view from the sidebars, asking about unsaved work exactly as the view menu does. */
  hideView(viewId: string): void {
    this.visibility.hide(viewId);
  }

  /** Shows a hidden view again, in the sidebar it was declared for or in the one named. */
  showView(viewId: string, regionId?: string): void {
    if (regionId !== undefined && !this.declared(regionId)) {
      return;
    }
    this.visibility.reveal(viewId, regionId);
  }

  private declared(regionId: string): boolean {
    return this.panelRegions.includes(regionId);
  }
}
