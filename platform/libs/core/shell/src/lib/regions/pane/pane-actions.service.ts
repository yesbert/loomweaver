import { inject, Service } from '@angular/core';
import { FeatureSwitches } from '../../features/feature-switches.service';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { tabRootOf } from '../content/content-path';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { PaneChromeService } from './chrome/pane-chrome.service';
import { SurfaceCloseGuard } from './unsaved-work/surface-close-guard';
import { PaneDragService } from './drag/pane-drag.service';
import { PaneMoveService } from './drag/pane-move.service';
import {
  containerChildInstances,
  paneRetentionScope,
} from './retention/retention-keys';
import { RetainedViewStash } from './retention/retained-view-stash';
import { isContentSideDock } from './container/container-children';
import { LeftOutChildren } from './container/left-out-children';
import { CONTENT_DOCK, isSamePane } from './tree/pane-address';
import { TabKeep, keepsOnPaneClose } from './tree/pane-handover';
import { PaneLeaf, leafPath } from './tree/pane-node';
import { findLeaf, leavesOf } from './tree/pane-queries';
import { PaneTreeService } from './tree/pane-tree.service';

@Service()
export class PaneActions {
  private readonly paneTree = inject(PaneTreeService);
  private readonly chrome = inject(PaneChromeService);
  private readonly moves = inject(PaneMoveService);
  private readonly tabs = inject(ContentTabsService);
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly stash = inject(RetainedViewStash);
  private readonly drag = inject(PaneDragService);
  private readonly features = inject(FeatureSwitches).content;
  private readonly registry = inject(ContributionRegistry);
  private readonly leftOut = inject(LeftOutChildren);

  split(dock: string, paneId: string, orientation: 'row' | 'column'): void {
    const leaf = this.leaf(dock, paneId);
    if (leaf === null) {
      return;
    }
    const path = leafPath(leaf) ?? this.addressCarriedBy(dock, paneId);
    if (path === undefined || !this.duplicable(path)) {
      return;
    }
    this.paneTree.splitPane(dock, paneId, orientation, path);
  }

  close(dock: string, paneId: string): void {
    const leaf = this.leaf(dock, paneId);
    if (leaf === null) {
      return;
    }
    const primary = paneId === this.paneTree.primaryId(dock);
    if (primary && !this.paneTree.isSplit(dock)) {
      return;
    }
    if (primary && dock === CONTENT_DOCK) {
      this.tabs.closePrimaryPane();
      return;
    }
    const keeps = this.keepsOnClose(dock);
    this.closeGuard.guarded(this.candidatesOf(dock, leaf, keeps), () => {
      if (primary) {
        this.paneTree.collapsePrimary(dock, keeps);
        return;
      }
      this.paneTree.closePane(dock, paneId, keeps);
    });
  }

  unsplit(dock: string): void {
    if (!this.paneTree.isSplit(dock)) {
      return;
    }
    const primary = this.paneTree.primaryId(dock);
    const keeps = this.keepsOnClose(dock);
    const candidates = leavesOf(this.paneTree.tree(dock))
      .filter((leaf) => leaf.id !== primary)
      .flatMap((leaf) => this.candidatesOf(dock, leaf, keeps));
    this.closeGuard.guarded(candidates, () =>
      this.paneTree.unsplit(dock, keeps),
    );
  }

  maximize(dock: string, paneId: string): void {
    if (this.leaf(dock, paneId) && !this.chrome.isMaximized(dock, paneId)) {
      this.chrome.toggleMaximize(dock, paneId);
    }
  }

  minimize(dock: string, paneId: string): void {
    if (this.leaf(dock, paneId) && !this.chrome.isMinimized(dock, paneId)) {
      this.chrome.toggleMinimize(dock, paneId);
    }
  }

  restore(dock: string, paneId?: string): void {
    if (paneId === undefined) {
      this.chrome.restore();
      return;
    }
    if (this.chrome.isMaximized(dock, paneId)) {
      this.chrome.restore();
    }
    if (this.chrome.isMinimized(dock, paneId)) {
      this.chrome.toggleMinimize(dock, paneId);
    }
  }

  focus(dock: string, paneId: string): void {
    if (this.leaf(dock, paneId) === null) {
      return;
    }
    const path = this.paneTree.focusPane(
      dock,
      paneId,
      this.tabs.activeTabRoot(),
    );
    if (path !== null) {
      this.tabs.navigateTo(path);
    }
  }

  moveTab(path: string, dock: string, paneId: string): void {
    const source = this.paneTree.sourceOf(path);
    if (
      source === null ||
      this.leaf(dock, paneId) === null ||
      isSamePane(source, { dock, paneId })
    ) {
      return;
    }
    this.moves.moveToStrip(source, path, { dock, paneId });
  }

  duplicable(path: string): boolean {
    return this.drag.canDuplicate(path);
  }

  private addressCarriedBy(dock: string, paneId: string): string | undefined {
    return this.paneTree.carriesAddress({ dock, paneId })
      ? this.tabs.activeTabRoot()
      : undefined;
  }

  private leaf(dock: string, paneId: string): PaneLeaf | null {
    return findLeaf(this.paneTree.tree(dock), paneId);
  }

  private keepsOnClose(dock: string): TabKeep {
    const keeps = keepsOnPaneClose(
      isContentSideDock(dock),
      this.features.close(),
    );
    return (tab) => keeps(tab) || this.leftOut.hides(tab.path);
  }

  private candidatesOf(
    dock: string,
    leaf: PaneLeaf,
    keeps: TabKeep,
  ): unknown[] {
    const scope = paneRetentionScope(dock, leaf.id);
    return leaf.tabs.flatMap((tab) =>
      keeps(tab)
        ? []
        : [
            ...this.stash.instancesFor(
              scope,
              tabRootOf(this.registry.contentRoutes(), tab.path),
            ),
            ...containerChildInstances(this.stash.keyedInstances(), tab.path),
          ],
    );
  }
}
