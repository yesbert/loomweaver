import { inject, Service } from '@angular/core';
import { normalizePath } from '../../regions/content/content-path';
import { ContentRouter } from '../../regions/content/routing/content-router';
import { NavigationOptions } from '../../regions/content/tabs/content-tab-projection';
import { TabNavigationService } from '../../regions/content/tabs/tab-navigation.service';
import { ActiveWorkspaceService } from '../active-workspace.service';
import { settlementDestination } from '../baseline/workspace-lookup';
import { WorkspaceCatalog } from '../catalog/workspace-catalog';
import { claimFor } from '../workspace-claims';

@Service()
export class AddressSettlement {
  private readonly active = inject(ActiveWorkspaceService);
  private readonly catalog = inject(WorkspaceCatalog);
  private readonly contentRouter = inject(ContentRouter);
  private readonly tabNavigation = inject(TabNavigationService);

  private chosen: string | null = null;

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

  destinationFor(path: string): string | null {
    return claimFor(this.catalog.activeClaims(), path)?.workspaceId ?? null;
  }
}
