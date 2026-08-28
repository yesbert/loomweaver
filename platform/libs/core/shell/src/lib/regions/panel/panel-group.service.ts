import { inject, Service } from '@angular/core';
import { VIEW_PANE_PREFIX, viewForPanePath } from '../pane/tree/pane-address';
import { PaneTab } from '../pane/tree/pane-node';
import { findLeaf } from '../pane/tree/pane-queries';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { PanelViewsService } from './panel-views.service';
import { HiddenViewsService } from './hidden-views.service';

@Service()
export class PanelGroupService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);
  private readonly panelViews = inject(PanelViewsService);
  private readonly hiddenViews = inject(HiddenViewsService);

  tabs(regionId: string): readonly PaneTab[] {
    return this.paneTree
      .primaryTabs(regionId)
      .filter((tab) => this.displayable(tab));
  }

  activePath(regionId: string): string | undefined {
    const tabs = this.tabs(regionId);
    const active = findLeaf(
      this.paneTree.tree(regionId),
      this.paneTree.primaryId(regionId),
    )?.active;
    return tabs.some((tab) => tab.path === active) ? active : tabs[0]?.path;
  }

  activeInstance(regionId: string): string | undefined {
    const path = this.activePath(regionId);
    return this.tabs(regionId).find((tab) => tab.path === path)?.instance;
  }

  clearActiveInstance(regionId: string): void {
    const path = this.activePath(regionId);
    if (path !== undefined) {
      this.paneTree.clearTabInstance(
        regionId,
        this.paneTree.primaryId(regionId),
        path,
      );
    }
  }

  select(regionId: string, path: string): void {
    this.paneTree.setActiveTab(
      regionId,
      this.paneTree.primaryId(regionId),
      path,
    );
  }

  seed(regionId: string): void {
    this.pruneHidden(regionId);
    const seeded = this.seededPaths(regionId);
    const missing = seeded.filter((path) => !this.paneTree.hasTab(path));
    this.paneTree.seedPrimaryTabs(regionId, missing, seeded);
  }

  seededPaths(regionId: string): string[] {
    return this.declaredPaths(regionId).filter(
      (path) => !this.hiddenViews.isHidden(path.slice(VIEW_PANE_PREFIX.length)),
    );
  }

  declaredPaths(regionId: string): string[] {
    return this.panelViews
      .viewsInRegion(regionId)
      .map((view) => VIEW_PANE_PREFIX + view.id);
  }

  private pruneHidden(regionId: string): void {
    const tabs = this.paneTree.primaryTabs(regionId);
    const kept = tabs.filter((tab) => !this.hiddenViewTab(tab));
    if (kept.length !== tabs.length) {
      this.paneTree.setPrimaryTabs(regionId, kept);
    }
  }

  private hiddenViewTab(tab: PaneTab): boolean {
    return (
      tab.path.startsWith(VIEW_PANE_PREFIX) &&
      this.hiddenViews.isHidden(tab.path.slice(VIEW_PANE_PREFIX.length))
    );
  }

  private displayable(tab: PaneTab): boolean {
    if (!tab.path.startsWith(VIEW_PANE_PREFIX)) {
      return true;
    }
    const view = viewForPanePath(this.registry.views(), tab.path);
    return !!view && this.auth.meets(view.access);
  }
}
