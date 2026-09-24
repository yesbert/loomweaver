import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { tabHolderOf } from '../pane/tree/pane-queries';
import { isContainerDock } from '../pane/container/container-children';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { RetainedViewStash } from '../pane/retention/retained-view-stash';
import {
  pathOfRetentionKey,
  scopeOfRetentionKey,
} from '../pane/retention/retention-keys';
import { SurfaceCloseGuard } from '../pane/unsaved-work/surface-close-guard';
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

  hide(viewId: string): void {
    this.closeGuard.guarded(this.openInstancesOf(viewId), () => {
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

  private regionOf(viewId: string): string | undefined {
    const view = this.registry.views().find((v) => v.id === viewId);
    return view?.region;
  }

  private openInstancesOf(viewId: string): unknown[] {
    const path = VIEW_PANE_PREFIX + viewId;
    return this.stash
      .keyedInstances()
      .filter(
        (entry) =>
          !isContainerDock(scopeOfRetentionKey(entry.key)) &&
          pathOfRetentionKey(entry.key) === path,
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
