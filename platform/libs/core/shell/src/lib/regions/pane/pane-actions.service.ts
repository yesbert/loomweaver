import { inject, Service } from '@angular/core';
import { isHomePath } from '../content/content-path';
import { ContentTabsService } from '../content/tabs/content-tabs.service';
import { PaneChromeService } from './chrome/pane-chrome.service';
import { SurfaceCloseGuard } from './close/surface-close-guard';
import { PaneDragService } from './drag/pane-drag.service';
import { PaneMoveService } from './drag/pane-move.service';
import {
  containerChildInstances,
  paneRetentionScope,
} from './retention/retention-policy';
import { RetainedViewStash } from './retention/retained-view-stash';
import { CONTENT_DOCK } from './tree/pane-address';
import { PaneLeaf, PaneNode, leafPath } from './tree/pane-node';
import { findLeaf } from './tree/pane-queries';
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

  split(dock: string, paneId: string, orientation: 'row' | 'column'): void {
    const leaf = this.leaf(dock, paneId);
    const path = leaf ? leafPath(leaf) : undefined;
    if (leaf === null || path === undefined || !this.duplicable(path)) {
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
    if (primary && dock === CONTENT_DOCK) {
      this.tabs.closePrimaryPane();
      return;
    }
    this.closeGuard.guarded(this.candidatesOf(dock, leaf), () => {
      if (primary) {
        this.paneTree.collapsePrimary(dock);
        return;
      }
      this.paneTree.closePane(dock, paneId);
    });
  }

  unsplit(dock: string): void {
    if (!this.paneTree.isSplit(dock)) {
      return;
    }
    const primary = this.paneTree.primaryId(dock);
    const candidates = leavesOf(this.paneTree.tree(dock))
      .filter((leaf) => leaf.id !== primary)
      .flatMap((leaf) => this.candidatesOf(dock, leaf));
    this.closeGuard.guarded(candidates, () => this.paneTree.unsplit(dock));
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
      (source.dock === dock && source.paneId === paneId)
    ) {
      return;
    }
    this.moves.moveToStrip(source, path, { dock, paneId });
  }

  duplicable(path: string): boolean {
    return path !== '' && !isHomePath(path) && this.drag.canHost(path);
  }

  private leaf(dock: string, paneId: string): PaneLeaf | null {
    return findLeaf(this.paneTree.tree(dock), paneId);
  }

  private candidatesOf(dock: string, leaf: PaneLeaf): unknown[] {
    const scope = paneRetentionScope(dock, leaf.id);
    return leaf.tabs.flatMap((tab) => [
      ...this.stash.instancesFor(scope, tab.path),
      ...containerChildInstances(this.stash.keyedInstances(), tab.path),
    ]);
  }
}

export function leavesOf(node: PaneNode): PaneLeaf[] {
  return node.kind === 'leaf'
    ? [node]
    : [...leavesOf(node.first), ...leavesOf(node.second)];
}
