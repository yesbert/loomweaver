import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { normalizePath, tabRootOf } from '../../regions/content/content-path';
import { ContentRouter } from '../../regions/content/routing/content-router';
import { NavigationOptions } from '../../regions/content/tabs/content-tab-projection';
import { TabNavigationService } from '../../regions/content/tabs/tab-navigation.service';
import { CONTENT_DOCK } from '../../regions/pane/tree/pane-address';
import { leavesOf } from '../../regions/pane/tree/pane-queries';
import { PaneTreeService } from '../../regions/pane/tree/pane-tree.service';
import { ActiveWorkspaceService } from '../active-workspace.service';
import { settlementDestination } from '../catalog/workspace-lookup';
import { WorkspaceCatalog } from '../catalog/workspace-catalog';
import { claimFor } from '../workspace-claims';

interface WithheldVisit {
  readonly workspaceId: string;
  readonly root: string;
}

@Service()
export class AddressSettlement {
  private readonly active = inject(ActiveWorkspaceService);
  private readonly catalog = inject(WorkspaceCatalog);
  private readonly contentRouter = inject(ContentRouter);
  private readonly tabNavigation = inject(TabNavigationService);
  private readonly paneTree = inject(PaneTreeService);
  private readonly registry = inject(ContributionRegistry);

  private chosen: string | null = null;
  private withheld: WithheldVisit | null = null;

  choose(path: string, options: NavigationOptions = {}): void {
    this.chosen = normalizePath(path);
    this.contentRouter.hold(path);
    this.tabNavigation.navigateTo(path, options);
  }

  wouldSettle(path: string): boolean {
    return (
      this.chosen !== normalizePath(path) &&
      this.settlementDestination(path) !== null
    );
  }

  takeDestination(path: string): string | null {
    const chosen = this.chosen;
    this.chosen = null;
    if (chosen !== null && chosen === normalizePath(path)) {
      return null;
    }
    return this.settlementDestination(path);
  }

  settlementDestination(path: string): string | null {
    return settlementDestination(
      path,
      this.active.id(),
      this.catalog.definitions,
      this.catalog.saved(),
    );
  }

  withhold(path: string): void {
    const root = this.rootOf(path);
    if (this.isWithheld(root)) {
      return;
    }
    const waiting =
      this.settlementDestination(path) !== null && !this.holdsContentAt(root);
    this.withheld = waiting ? { workspaceId: this.active.id(), root } : null;
  }

  leaveWithheld(path: string): void {
    const root = this.rootOf(path);
    const withheld = this.isWithheld(root);
    this.withheld = null;
    if (!withheld) {
      return;
    }
    for (const leaf of leavesOf(this.paneTree.tree(CONTENT_DOCK))) {
      for (const tab of leaf.tabs) {
        if (this.rootOf(tab.path) === root) {
          this.paneTree.removeTab(CONTENT_DOCK, leaf.id, tab.path);
        }
      }
    }
  }

  destinationFor(path: string): string | null {
    return claimFor(this.catalog.activeClaims(), path)?.workspaceId ?? null;
  }

  private isWithheld(root: string): boolean {
    return (
      this.withheld?.workspaceId === this.active.id() &&
      this.withheld.root === root
    );
  }

  private holdsContentAt(root: string): boolean {
    return leavesOf(this.paneTree.tree(CONTENT_DOCK)).some((leaf) =>
      leaf.tabs.some((tab) => this.rootOf(tab.path) === root),
    );
  }

  private rootOf(path: string): string {
    return tabRootOf(this.registry.contentRoutes(), normalizePath(path));
  }
}
