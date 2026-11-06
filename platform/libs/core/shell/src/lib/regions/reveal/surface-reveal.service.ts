import { inject, Service } from '@angular/core';
import { CONTENT_DOCK, PaneRef, viewPanePath } from '../pane/tree/pane-address';
import { leavesOf } from '../pane/tree/pane-queries';
import { isContainerDock } from '../pane/container/container-children';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { PanelState } from '../panel/panel-state';
import { PanelGroupService } from '../panel/panel-group.service';
import { ViewportService } from '../../layout/viewport.service';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { SHELL_LAYOUT } from '../../layout/layout';
import { regionIdsOfType } from '../../layout/layout-queries';
import { PaneChromeService } from '../pane/chrome/pane-chrome.service';
import { SurfaceCopyRecency } from './surface-copy-recency';
import { inReadingOrder } from './reading-order';

@Service()
export class SurfaceRevealService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly tabs = inject(ContentTabsService);
  private readonly panels = inject(PanelState);
  private readonly panelGroup = inject(PanelGroupService);
  private readonly viewport = inject(ViewportService);
  private readonly registry = inject(ContributionRegistry);
  private readonly recency = inject(SurfaceCopyRecency);
  private readonly chrome = inject(PaneChromeService);
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly panelRegions = regionIdsOfType(this.layout, 'panel');

  reveal(surfaceId: string): void {
    const path = viewPanePath(surfaceId);
    const placement =
      this.chosenCopy(path, this.copiesOf(path)) ??
      this.placementAfterSeeding(surfaceId, path);
    if (placement) {
      this.activate(placement, path);
    }
  }

  private copiesOf(path: string): PaneRef[] {
    return Object.entries(this.paneTree.dockTrees())
      .filter(([dock]) => !isContainerDock(dock))
      .flatMap(([dock, tree]) =>
        leavesOf(tree)
          .filter((leaf) => leaf.tabs.some((tab) => tab.path === path))
          .map((leaf) => ({ dock, paneId: leaf.id })),
      );
  }

  private chosenCopy(
    path: string,
    copies: readonly PaneRef[],
  ): PaneRef | undefined {
    const recent = this.recency.mostRecent(path, copies);
    return (
      recent.find((copy) => this.paneTree.carriesAddress(copy)) ??
      inReadingOrder(this.layout, recent)[0]
    );
  }

  private placementAfterSeeding(
    surfaceId: string,
    path: string,
  ): PaneRef | undefined {
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
    return this.copiesOf(path)[0];
  }

  private activate(pane: PaneRef, path: string): void {
    const { dock, paneId } = pane;
    if (this.paneTree.carriesAddress(pane)) {
      this.tabs.activateViewTab(path);
    } else {
      this.paneTree.setActiveTab(dock, paneId, path);
    }
    if (dock === CONTENT_DOCK) {
      this.putPaneInView(pane);
      return;
    }
    this.panels.expand(dock);
    if (this.viewport.compact()) {
      this.panels.openOverlay(dock);
    }
  }

  private putPaneInView({ dock, paneId }: PaneRef): void {
    if (this.chrome.isMinimized(dock, paneId)) {
      this.chrome.toggleMinimize(dock, paneId);
    }
    const maximized = this.chrome.maximizedPaneIn(dock);
    if (maximized !== null && maximized !== paneId) {
      this.chrome.endMaximize();
    }
  }
}
