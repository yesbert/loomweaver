import { inject, Service } from '@angular/core';
import { CONTENT_DOCK, viewPanePath } from '../pane/tree/pane-address';
import { findLeafWithTab } from '../pane/tree/pane-queries';
import { CONTAINER_DOCK_PREFIX } from '../pane/container/container-children';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { PanelState } from '../panel/panel-state';
import { PanelGroupService } from '../panel/panel-group.service';
import { ViewportService } from '../../layout/viewport.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { SHELL_LAYOUT } from '../../layout/layout';
import { regionIdsOfType } from '../../layout/layout-queries';

interface Placement {
  readonly dock: string;
  readonly paneId: string;
}

@Service()
export class SurfaceRevealService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly tabs = inject(ContentTabsService);
  private readonly panels = inject(PanelState);
  private readonly panelGroup = inject(PanelGroupService);
  private readonly viewport = inject(ViewportService);
  private readonly registry = inject(ContributionRegistry);
  private readonly panelRegions = regionIdsOfType(
    inject(SHELL_LAYOUT),
    'panel',
  );

  reveal(surfaceId: string): void {
    const path = viewPanePath(surfaceId);
    const placement =
      this.placementOf(path) ?? this.placementAfterSeeding(surfaceId, path);
    if (placement) {
      this.activate(placement, path);
    }
  }

  private placementOf(path: string): Placement | undefined {
    for (const [dock, tree] of Object.entries(this.paneTree.dockTrees())) {
      if (dock.startsWith(CONTAINER_DOCK_PREFIX)) {
        continue;
      }
      const leaf = findLeafWithTab(tree, path);
      if (leaf) {
        return { dock, paneId: leaf.id };
      }
    }
    return undefined;
  }

  private placementAfterSeeding(
    surfaceId: string,
    path: string,
  ): Placement | undefined {
    const region = this.registry
      .views()
      .find((view) => view.id === surfaceId)?.region;
    if (
      region === undefined ||
      !this.panelRegions.includes(region) ||
      !this.panelGroup.seededPaths(region).includes(path)
    ) {
      return undefined;
    }
    this.panelGroup.seed(region);
    return this.placementOf(path);
  }

  private activate({ dock, paneId }: Placement, path: string): void {
    if (
      dock === CONTENT_DOCK &&
      paneId === this.paneTree.primaryId(CONTENT_DOCK)
    ) {
      this.tabs.activateViewTab(path);
      return;
    }
    this.paneTree.setActiveTab(dock, paneId, path);
    if (dock === CONTENT_DOCK) {
      return;
    }
    this.panels.expand(dock);
    if (this.viewport.compact()) {
      this.panels.openOverlay(dock);
    }
  }
}
