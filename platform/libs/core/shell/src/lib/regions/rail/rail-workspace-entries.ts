import { afterNextRender, effect, inject, Injector, isDevMode, Service } from '@angular/core';
import { Disposable } from '@loomweaver/plugin-sdk';
import { SHELL_LAYOUT } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { RailItem } from '../../foundation/rail-item';
import { WorkspaceService } from '../../workspace/workspace.service';
import { RailItemsService, workspaceRailItemId } from './rail-items.service';
import { SHELL_FEATURES } from '../../foundation/shell-features';

const WORKSPACE_ENTRY_ORDER = 1000;

interface Registration {
  readonly item: RailItem;
  readonly disposable: Disposable;
}

@Service()
export class RailWorkspaceEntries {
  private readonly registry = inject(ContributionRegistry);
  private readonly workspaces = inject(WorkspaceService);
  private readonly railItems = inject(RailItemsService);
  private readonly injector = inject(Injector);
  private readonly rails = inject(SHELL_LAYOUT)
    .regions.filter((region) => region.type === 'rail')
    .map((region) => region.id);
  private readonly features = inject(SHELL_FEATURES).workspaces;
  private readonly enabled = this.features.enabled;

  private readonly registered = new Map<string, Registration>();

  start(): void {
    if (this.rails.length === 0 || !this.enabled) {
      return;
    }
    effect(() => this.reconcile(), { injector: this.injector });
    if (isDevMode()) {
      afterNextRender(() => this.reportUnoffered(), {
        injector: this.injector,
      });
    }
  }

  private reportUnoffered(): void {
    const offered = new Set(
      this.registry
        .railItems()
        .map((item) => item.workspace)
        .filter((id): id is string => id !== undefined),
    );
    for (const definition of this.workspaces.definitions) {
      if (offered.has(definition.id)) {
        continue;
      }
      console.warn(
        `Workspace "${definition.id}" is declared but nothing switches to it — ` +
          `it is reachable only through the workspace dialog. Register a rail item ` +
          `carrying workspace: "${definition.id}" to offer it under an icon of your own.`,
      );
    }
  }

  private reconcile(): void {
    const wanted = this.wantedItems();
    for (const [id, registration] of this.registered) {
      if (wanted.has(id)) {
        continue;
      }

      registration.disposable.dispose();
      this.registered.delete(id);
    }
    for (const [id, item] of wanted) {
      const current = this.registered.get(id);
      if (current && sameItem(current.item, item)) {
        continue;
      }
      current?.disposable.dispose();
      this.registered.set(id, {
        item,
        disposable: this.registry.addRailItem(item),
      });
    }
  }

  private wantedItems(): Map<string, RailItem> {
    const wanted = new Map<string, RailItem>();
    const initials = this.workspaces.initials();
    let order = WORKSPACE_ENTRY_ORDER;
    const offered = this.features.savedInRail ? this.workspaces.workspaces() : [];
    for (const workspace of offered) {
      const id = workspaceRailItemId(workspace.id);
      if (!this.railItems.isVisible(id)) {
        continue;
      }
      const rail = this.railItems.regionOf(id, this.rails[0]);
      wanted.set(id, {
        id,
        rail: this.rails.includes(rail) ? rail : this.rails[0],
        icon: 'workspaces',
        initials: initials.get(workspace.id),
        title: workspace.name,
        order,
        workspace: workspace.id,
      });
      order += 1;
    }
    return wanted;
  }
}

function sameItem(a: RailItem, b: RailItem): boolean {
  return (
    a.title === b.title &&
    a.order === b.order &&
    a.rail === b.rail &&
    a.initials === b.initials
  );
}
