import { inject, Service } from '@angular/core';
import {
  CONTENT_DOCK,
  isSamePane,
  isViewPanePath,
  PaneRef,
} from '../tree/pane-address';
import {
  PaneLeaf,
  PaneNode,
  PaneTab,
  PRIMARY_LEAF,
  isDisposableLeaf,
  newPaneId,
  tabWithout,
} from '../tree/pane-node';
import { findLeaf } from '../tree/pane-queries';
import { splitLeafWith } from '../tree/pane-structure';
import { isContainerDock } from '../container/container-children';
import { insertTab, removeTab } from '../tree/pane-tabs';
import { PaneTreeService } from '../tree/pane-tree.service';
import { PaneAdmission } from '../../content/pane-admission';
import { ContentTabsService } from '../../content/tabs/content-tabs.service';
import { declaringRoute, tabRootOf } from '../../content/content-path';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { ActiveWorkspaceService } from '../../../workspace/active-workspace.service';
import { LeftOutChildren } from '../container/left-out-children';
import { SurfaceCloseGuard } from '../unsaved-work/surface-close-guard';
import { UnsavedWork } from '../unsaved-work/unsaved-work';

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

interface PlannedMove {
  readonly source: PaneRef;
  readonly tab: PaneTab;
  readonly arrival: PaneRef;
  readonly moved: PaneTab;
  readonly edits: Record<string, PaneNode>;
}

function departedTab(targetDock: string, tab: PaneTab): PaneTab {
  return tab.preview && targetDock !== CONTENT_DOCK
    ? tabWithout(tab, 'preview')
    : tab;
}

@Service()
export class PaneMoveService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly admission = inject(PaneAdmission);
  private readonly tabs = inject(ContentTabsService);
  private readonly registry = inject(ContributionRegistry);
  private readonly leftOut = inject(LeftOutChildren);
  private readonly unsavedWork = inject(UnsavedWork);
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly workspace = inject(ActiveWorkspaceService);

  moveToStrip(
    source: PaneRef,
    rawPath: string,
    target: PaneRef,
    index?: number,
  ): void {
    this.relocate(() => {
      const tab = this.resolveTab(source, rawPath);
      if (!tab || isSamePane(source, target)) {
        return null;
      }
      const at = this.paneTree.carriesAddress(target)
        ? undefined
        : this.storedIndex(target, index);
      const moved = departedTab(target.dock, tab);
      return this.planned(source, tab, target, moved, (tree) =>
        insertTab(tree, target.paneId, moved, at),
      );
    });
  }

  moveToEdge(
    source: PaneRef,
    rawPath: string,
    target: PaneRef,
    edge: PaneDropEdge,
  ): void {
    const orientation = edge === 'left' || edge === 'right' ? 'row' : 'column';
    const position = edge === 'left' || edge === 'top' ? 'before' : 'after';
    this.relocate(() => {
      const tab = this.resolveTab(source, rawPath);
      if (
        !tab ||
        (isSamePane(source, target) && !this.sourceRetainsContent(source, tab))
      ) {
        return null;
      }
      const moved = departedTab(target.dock, tab);
      const added: PaneLeaf = {
        kind: 'leaf',
        id: newPaneId(),
        tabs: [moved],
        active: moved.path,
      };
      const arrival = { dock: target.dock, paneId: added.id };
      return this.planned(source, tab, arrival, moved, (tree) =>
        splitLeafWith(tree, target.paneId, orientation, added, position),
      );
    });
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

  private relocate(plan: () => PlannedMove | null): void {
    const first = plan();
    if (!first) {
      return;
    }
    const workspace = this.workspace.id();
    const arrangement = this.paneTree.arrangement();
    const lost = this.lostBy(first);
    const asked = new Set(this.needingAnAnswer(lost));
    this.closeGuard.guarded(lost, () => {
      const unchanged =
        this.workspace.id() === workspace &&
        this.paneTree.arrangement() === arrangement;
      const move = unchanged ? plan() : null;
      if (
        !move ||
        this.needingAnAnswer(this.lostBy(move)).some((one) => !asked.has(one))
      ) {
        return;
      }
      const follow = this.urlFollowup(move.source, move.tab);
      for (const [dock, tree] of Object.entries(move.edits)) {
        this.paneTree.commit(dock, tree);
      }
      this.collapseEmptiedPrimary(move.source.dock);
      this.afterArrival(move.arrival, move.moved, follow);
    });
  }

  private needingAnAnswer(instances: readonly unknown[]): unknown[] {
    return instances.filter((instance) => this.closeGuard.mustAsk([instance]));
  }

  private lostBy(move: PlannedMove): unknown[] {
    const before = this.paneTree.dockTrees();
    return this.unsavedWork.lostBy(before, { ...before, ...move.edits });
  }

  private planned(
    source: PaneRef,
    tab: PaneTab,
    arrival: PaneRef,
    moved: PaneTab,
    applyToTarget: (tree: PaneNode) => PaneNode,
  ): PlannedMove | null {
    const emptied = this.removeSourceTab(
      this.paneTree.tree(source.dock),
      source,
      tab,
    );
    const edits: Record<string, PaneNode> =
      source.dock === arrival.dock
        ? { [source.dock]: applyToTarget(emptied) }
        : {
            [source.dock]: emptied,
            [arrival.dock]: applyToTarget(this.paneTree.tree(arrival.dock)),
          };
    const arrived = findLeaf(edits[arrival.dock], arrival.paneId)?.tabs.some(
      (held) => held.path === moved.path,
    );
    return arrived ? { source, tab, arrival, moved, edits } : null;
  }

  private collapseEmptiedPrimary(dock: string): void {
    const primary = findLeaf(
      this.paneTree.tree(dock),
      this.paneTree.primaryId(dock),
    );
    if (isContainerDock(dock) && primary && isDisposableLeaf(primary, [])) {
      this.paneTree.collapsePrimary(dock);
    }
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
    if (target.dock === CONTENT_DOCK && this.admission.routerBound(tab.path)) {
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
    return declaringRoute(routes, root) ? root : '';
  }
}
