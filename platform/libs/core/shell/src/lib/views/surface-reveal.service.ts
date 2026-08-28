import { inject, Service } from '@angular/core';
import { VIEW_PANE_PREFIX } from '../regions/pane/tree/pane-address';
import { findLeafWithTab } from '../regions/pane/tree/pane-queries';
import { CONTAINER_DOCK_PREFIX } from '../regions/pane/container/container-children';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { ContentTabsService } from '../regions/content/tabs/content-tabs.service';
import { PanelState } from '../regions/panel/panel-state';

@Service()
export class SurfaceRevealService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly tabs = inject(ContentTabsService);
  private readonly panels = inject(PanelState);

  reveal(surfaceId: string): void {
    const path = VIEW_PANE_PREFIX + surfaceId;
    for (const [dock, tree] of Object.entries(this.paneTree.dockTrees())) {
      if (dock.startsWith(CONTAINER_DOCK_PREFIX)) {
        continue;
      }
      const leaf = findLeafWithTab(tree, path);
      if (!leaf) {
        continue;
      }
      this.activate(dock, leaf.id, path);
      return;
    }
  }

  private activate(dock: string, paneId: string, path: string): void {
    if (
      dock === CONTENT_DOCK &&
      paneId === this.paneTree.primaryId(CONTENT_DOCK)
    ) {
      this.tabs.activateViewTab(path);
      return;
    }
    this.paneTree.setActiveTab(dock, paneId, path);
    if (dock !== CONTENT_DOCK) {
      this.panels.expand(dock);
    }
  }
}
