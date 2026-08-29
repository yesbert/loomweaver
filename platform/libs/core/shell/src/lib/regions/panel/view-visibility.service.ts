import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { tabHolderOf } from '../pane/tree/pane-queries';
import {
  CONTAINER_DOCK_PREFIX,
  isContainerDock,
} from '../pane/container/container-children';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { RetainedViewStash } from '../pane/retention/retained-view-stash';
import { SurfaceCloseGuard } from '../pane/close/surface-close-guard';
import { HiddenViewsService } from './hidden-views.service';
import { PanelGroupService } from './panel-group.service';
import { ViewMoveService } from './view-move.service';

@Service()
export class ViewVisibilityService {
  private readonly hiddenViews = inject(HiddenViewsService);
  private readonly paneTree = inject(PaneTreeService);
  private readonly panelGroup = inject(PanelGroupService);
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly stash = inject(RetainedViewStash);
  private readonly registry = inject(ContributionRegistry);
  private readonly moves = inject(ViewMoveService);

  isHidden(viewId: string): boolean {
    return this.hiddenViews.isHidden(viewId);
  }

  hide(viewId: string): void {
    this.closeGuard.guarded(this.candidates(viewId), () => {
      this.hiddenViews.hide(viewId);
      this.removeTabs(VIEW_PANE_PREFIX + viewId);
    });
  }

  reveal(viewId: string, region?: string): void {
    this.hiddenViews.show(viewId);
    const target = region ?? this.regionOf(viewId);
    if (target === undefined) {
      return;
    }
    const path = VIEW_PANE_PREFIX + viewId;
    if (this.regionOf(viewId) === target && !this.paneTree.hasTab(path)) {
      this.panelGroup.seed(target);
      return;
    }
    this.moves.move(viewId, target);
  }

  toggle(viewId: string, region?: string): void {
    if (region !== undefined) {
      this.toggleIn(viewId, region);
      return;
    }
    if (this.hiddenViews.isHidden(viewId)) {
      this.reveal(viewId);
      return;
    }
    this.hide(viewId);
  }

  private toggleIn(viewId: string, region: string): void {
    if (this.paneTree.sourceOf(VIEW_PANE_PREFIX + viewId)?.dock === region) {
      this.hide(viewId);
      return;
    }
    this.reveal(viewId, region);
  }

  private regionOf(viewId: string): string | undefined {
    const view = this.registry.views().find((v) => v.id === viewId);
    return view?.region;
  }

  private candidates(viewId: string): unknown[] {
    const path = VIEW_PANE_PREFIX + viewId;
    return this.stash
      .keyedInstances()
      .filter(
        (entry) =>
          !entry.key.startsWith(CONTAINER_DOCK_PREFIX) &&
          entry.key.split('|', 2)[1] === path,
      )
      .map((entry) => entry.instance);
  }

  private removeTabs(path: string): void {
    for (const dock of Object.keys(this.paneTree.dockTrees())) {
      if (!isContainerDock(dock)) {
        this.removeFromDock(dock, path);
      }
    }
  }

  private removeFromDock(dock: string, path: string): void {
    const primary = this.paneTree.primaryTabs(dock);
    if (primary.some((tab) => tab.path === path)) {
      this.paneTree.setPrimaryTabs(
        dock,
        primary.filter((tab) => tab.path !== path),
      );
    }
    let holder = tabHolderOf(this.paneTree.tree(dock), path);
    while (holder !== null) {
      this.paneTree.removeTab(dock, holder, path);
      const next = tabHolderOf(this.paneTree.tree(dock), path);
      if (next === holder) {
        return;
      }
      holder = next;
    }
  }
}
