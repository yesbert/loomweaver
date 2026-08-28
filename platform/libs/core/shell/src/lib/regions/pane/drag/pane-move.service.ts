import { inject, Service } from '@angular/core';
import { CONTENT_DOCK, VIEW_PANE_PREFIX } from '../tree/pane-address';
import {
  PRIMARY_LEAF,
  PaneLeaf,
  PaneNode,
  PaneTab,
  newPaneId,
} from '../tree/pane-node';
import { findLeaf } from '../tree/pane-queries';
import { splitLeafWith } from '../tree/pane-structure';
import { insertTab, removeTab, tabWithout } from '../tree/pane-tabs';
import { PaneTreeService } from '../tree/pane-tree.service';
import { settleMovedTree } from './settle-moved-tree';
import { PaneDragService, TabDragSource } from './pane-drag.service';
import { ContentTabsService } from '../../content/tabs/content-tabs.service';
import { matchRoute, tabRootOf } from '../../content/content-path';
import { ContributionRegistry } from '../../../plugin/contribution-registry';

export type PaneDropEdge = 'top' | 'bottom' | 'left' | 'right';

export function stripSourceOf(listId: string): TabDragSource | null {
  const parts = listId.split(':');
  if (parts[0] !== 'pane-strip' || parts.length < 3) {
    return null;
  }
  return { dock: parts[1], paneId: parts.slice(2).join(':') };
}

export function stripIdOf(source: TabDragSource): string {
  return `pane-strip:${source.dock}:${source.paneId}`;
}

@Service()
export class PaneMoveService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly drag = inject(PaneDragService);
  private readonly tabs = inject(ContentTabsService);
  private readonly registry = inject(ContributionRegistry);

  moveToStrip(
    source: TabDragSource,
    rawPath: string,
    target: TabDragSource,
    index?: number,
  ): void {
    const tab = this.resolveTab(source, rawPath);
    if (
      !tab ||
      (source.dock === target.dock && source.paneId === target.paneId)
    ) {
      return;
    }
    const at = this.isUrlGroup(target) ? undefined : index;
    const follow = this.urlFollowup(source, tab);
    const moved = this.departedTab(source, this.isUrlGroup(target), tab);
    this.relocateTab(source, tab, target.dock, (tree) =>
      insertTab(tree, target.paneId, moved, at),
    );
    this.afterArrival(target, moved, follow);
  }

  moveToEdge(
    source: TabDragSource,
    rawPath: string,
    target: TabDragSource,
    edge: PaneDropEdge,
  ): void {
    const tab = this.resolveTab(source, rawPath);
    if (!tab) {
      return;
    }
    const samePane =
      source.dock === target.dock && source.paneId === target.paneId;
    if (samePane && !this.sourceRetainsContent(source, tab)) {
      return;
    }
    const follow = this.urlFollowup(source, tab);
    const moved = this.departedTab(source, false, tab);
    const orientation = edge === 'left' || edge === 'right' ? 'row' : 'column';
    const position = edge === 'left' || edge === 'top' ? 'before' : 'after';
    const added: PaneLeaf = {
      kind: 'leaf',
      id: newPaneId(),
      tabs: [moved],
      active: moved.path,
    };
    this.relocateTab(source, tab, target.dock, (tree) =>
      splitLeafWith(tree, target.paneId, orientation, added, position),
    );
    this.afterArrival({ dock: target.dock, paneId: added.id }, moved, follow);
  }

  splitFromUrlGroup(rootPath: string, orientation: 'row' | 'column'): void {
    const source: TabDragSource = {
      dock: CONTENT_DOCK,
      paneId: this.paneTree.primaryId(CONTENT_DOCK),
    };
    this.moveToEdge(
      source,
      rootPath,
      source,
      orientation === 'row' ? 'right' : 'bottom',
    );
  }

  private relocateTab(
    source: TabDragSource,
    tab: PaneTab,
    targetDock: string,
    applyToTarget: (tree: PaneNode) => PaneNode,
  ): void {
    if (source.dock === targetDock) {
      this.commitSource(
        source.dock,
        applyToTarget(
          this.removeSourceTab(this.paneTree.tree(source.dock), source, tab),
        ),
      );
      return;
    }
    this.commitSource(
      source.dock,
      this.removeSourceTab(this.paneTree.tree(source.dock), source, tab),
    );
    this.paneTree.commitTree(
      targetDock,
      applyToTarget(this.paneTree.tree(targetDock)),
    );
  }

  private resolveTab(
    source: TabDragSource,
    rawPath: string,
  ): PaneTab | undefined {
    const leaf = findLeaf(this.paneTree.tree(source.dock), source.paneId);
    if (!leaf) {
      return undefined;
    }
    const exact = leaf.tabs.find((tab) => tab.path === rawPath);
    if (exact || !this.isUrlGroup(source)) {
      return exact;
    }
    const routes = this.registry.contentRoutes();
    return leaf.tabs.find((tab) => tabRootOf(routes, tab.path) === rawPath);
  }

  private isUrlGroup(source: TabDragSource): boolean {
    return (
      source.dock === CONTENT_DOCK &&
      source.paneId === this.paneTree.primaryId(CONTENT_DOCK)
    );
  }

  private tabCount(source: TabDragSource): number {
    return (
      findLeaf(this.paneTree.tree(source.dock), source.paneId)?.tabs.length ?? 0
    );
  }

  private sourceRetainsContent(source: TabDragSource, tab: PaneTab): boolean {
    if (this.tabCount(source) > 1) {
      return true;
    }
    return this.isUrlGroup(source) && this.tabs.neighbourOf(tab.path) !== '';
  }

  private departedTab(
    source: TabDragSource,
    targetIsUrlGroup: boolean,
    tab: PaneTab,
  ): PaneTab {
    const leavesUrlGroup = this.isUrlGroup(source) && !targetIsUrlGroup;
    return leavesUrlGroup && tab.preview ? tabWithout(tab, 'preview') : tab;
  }

  private removeSourceTab(
    tree: PaneNode,
    source: TabDragSource,
    tab: PaneTab,
  ): PaneNode {
    return (
      removeTab(
        tree,
        source.paneId,
        tab.path,
        this.paneTree.primaryId(source.dock),
      ) ?? PRIMARY_LEAF
    );
  }

  private commitSource(dock: string, node: PaneNode): void {
    this.paneTree.commitTree(
      dock,
      settleMovedTree(dock, node, this.paneTree.primaryId(dock)),
    );
  }

  private urlFollowup(source: TabDragSource, tab: PaneTab): string | null {
    if (!this.isUrlGroup(source)) {
      return null;
    }
    const routes = this.registry.contentRoutes();
    return tabRootOf(routes, tab.path) === this.tabs.activeTabRoot()
      ? this.tabs.neighbourOf(tab.path)
      : null;
  }

  private afterArrival(
    target: TabDragSource,
    tab: PaneTab,
    urlFollowup: string | null,
  ): void {
    if (this.isUrlGroup(target)) {
      if (tab.path.startsWith(VIEW_PANE_PREFIX)) {
        this.tabs.activateViewTab(tab.path);
      } else {
        this.tabs.navigateTo(tab.path);
      }
      return;
    }
    if (target.dock === CONTENT_DOCK && this.drag.routerBound(tab.path)) {
      const previous =
        urlFollowup === '' ? null : (urlFollowup ?? this.currentUrlContent());
      const path = this.paneTree.focusPane(
        target.dock,
        target.paneId,
        previous,
      );
      if (path !== null) {
        this.tabs.navigateTo(path);
      }
      return;
    }
    if (urlFollowup !== null) {
      this.tabs.navigateTo(urlFollowup);
    }
  }

  private currentUrlContent(): string {
    const routes = this.registry.contentRoutes();
    const root = this.tabs.activeTabRoot();
    return matchRoute(routes, root) ? root : '';
  }
}
