import { inject, Service } from '@angular/core';
import {
  CONTENT_DOCK,
  isSamePane,
  isViewPanePath,
  PaneRef,
} from '../tree/pane-address';
import {
  PRIMARY_LEAF,
  PaneLeaf,
  PaneNode,
  PaneTab,
  newPaneId,
} from '../tree/pane-node';
import { findLeaf } from '../tree/pane-queries';
import { splitLeafWith, withoutEmptyPrimary } from '../tree/pane-structure';
import { isContainerDock } from '../container/container-children';
import { insertTab, removeTab } from '../tree/pane-tabs';
import { tabWithout } from '../tree/pane-node';
import { PaneTreeService } from '../tree/pane-tree.service';
import { PaneDragService } from './pane-drag.service';
import { ContentTabsService } from '../../content/tabs/content-tabs.service';
import { matchRoute, tabRootOf } from '../../content/content-path';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { LeftOutChildren } from '../container/left-out-children';

export type PaneDropEdge = 'top' | 'bottom' | 'left' | 'right';

export function stripSourceOf(listId: string): PaneRef | null {
  const parts = listId.split(':');
  if (parts[0] !== 'pane-strip' || parts.length !== 3) {
    return null;
  }
  return { dock: unescapeColons(parts[1]), paneId: unescapeColons(parts[2]) };
}

export function stripIdOf(source: PaneRef): string {
  return `pane-strip:${escapeColons(source.dock)}:${escapeColons(source.paneId)}`;
}

function escapeColons(part: string): string {
  return part.replaceAll('%', '%25').replaceAll(':', '%3A');
}

function unescapeColons(part: string): string {
  return part.replaceAll('%3A', ':').replaceAll('%25', '%');
}

function departedTab(targetDock: string, tab: PaneTab): PaneTab {
  return tab.preview && targetDock !== CONTENT_DOCK
    ? tabWithout(tab, 'preview')
    : tab;
}

@Service()
export class PaneMoveService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly drag = inject(PaneDragService);
  private readonly tabs = inject(ContentTabsService);
  private readonly registry = inject(ContributionRegistry);
  private readonly leftOut = inject(LeftOutChildren);

  moveToStrip(
    source: PaneRef,
    rawPath: string,
    target: PaneRef,
    index?: number,
  ): void {
    const tab = this.resolveTab(source, rawPath);
    if (!tab || isSamePane(source, target)) {
      return;
    }
    const at = this.paneTree.carriesAddress(target)
      ? undefined
      : this.storedIndex(target, index);
    const follow = this.urlFollowup(source, tab);
    const moved = departedTab(target.dock, tab);
    this.relocateTab(source, tab, target.dock, (tree) =>
      insertTab(tree, target.paneId, moved, at),
    );
    this.afterArrival(target, moved, follow);
  }

  moveToEdge(
    source: PaneRef,
    rawPath: string,
    target: PaneRef,
    edge: PaneDropEdge,
  ): void {
    const tab = this.resolveTab(source, rawPath);
    if (!tab) {
      return;
    }
    if (isSamePane(source, target) && !this.sourceRetainsContent(source, tab)) {
      return;
    }
    const follow = this.urlFollowup(source, tab);
    const moved = departedTab(target.dock, tab);
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

  splitTabOut(
    rootPath: string,
    orientation: 'row' | 'column',
    pane?: PaneRef,
  ): void {
    const source: PaneRef = pane ?? {
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
    source: PaneRef,
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
    this.paneTree.commit(
      targetDock,
      applyToTarget(this.paneTree.tree(targetDock)),
    );
  }

  private resolveTab(source: PaneRef, rawPath: string): PaneTab | undefined {
    const leaf = findLeaf(this.paneTree.tree(source.dock), source.paneId);
    if (!leaf) {
      return undefined;
    }
    const exact = leaf.tabs.find((tab) => tab.path === rawPath);
    if (exact || !this.paneTree.carriesAddress(source)) {
      return exact;
    }
    const routes = this.registry.contentRoutes();
    return leaf.tabs.find((tab) => tabRootOf(routes, tab.path) === rawPath);
  }

  private storedIndex(
    target: PaneRef,
    drawn: number | undefined,
  ): number | undefined {
    const tabs =
      findLeaf(this.paneTree.tree(target.dock), target.paneId)?.tabs ?? [];
    const shown = tabs.filter((tab) => !this.leftOut.hides(tab.path));
    if (drawn === undefined || shown.length === tabs.length) {
      return drawn;
    }
    const before = shown[drawn];
    return before ? tabs.indexOf(before) : tabs.length;
  }

  private tabCount(source: PaneRef): number {
    return (
      findLeaf(this.paneTree.tree(source.dock), source.paneId)?.tabs.length ?? 0
    );
  }

  private sourceRetainsContent(source: PaneRef, tab: PaneTab): boolean {
    if (this.tabCount(source) > 1) {
      return true;
    }
    return (
      this.paneTree.carriesAddress(source) &&
      this.tabs.neighbourOf(tab.path) !== ''
    );
  }

  private removeSourceTab(
    tree: PaneNode,
    source: PaneRef,
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
    this.paneTree.commit(
      dock,
      isContainerDock(dock)
        ? withoutEmptyPrimary(node, this.paneTree.primaryId(dock))
        : node,
    );
  }

  private urlFollowup(source: PaneRef, tab: PaneTab): string | null {
    if (!this.paneTree.carriesAddress(source)) {
      return null;
    }
    const routes = this.registry.contentRoutes();
    return tabRootOf(routes, tab.path) === this.tabs.activeTabRoot()
      ? this.tabs.neighbourOf(tab.path)
      : null;
  }

  private afterArrival(
    target: PaneRef,
    tab: PaneTab,
    urlFollowup: string | null,
  ): void {
    if (this.paneTree.carriesAddress(target)) {
      if (isViewPanePath(tab.path)) {
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
