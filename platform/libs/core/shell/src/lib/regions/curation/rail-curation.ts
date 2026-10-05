import { inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { LayoutRegion, SHELL_LAYOUT } from '../../layout/layout';
import { regionsOfType } from '../../layout/layout-queries';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { SlotResolution } from '../../menu/slot-resolution.service';
import { WorkspaceService } from '../../workspace/workspace.service';
import { FeatureSwitches } from '../../features/feature-switches.service';
import {
  RailItemsService,
  workspaceRailItemId,
} from '../rail/rail-items.service';
import { RailMoveService } from '../rail/rail-move.service';
import { CurationRow, CurationSource, HIDDEN } from './curation-source';
import { railMenuContext } from '../rail/rail-context-menu';

@Service()
export class RailCuration implements CurationSource {
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly registry = inject(ContributionRegistry);
  private readonly slots = inject(SlotResolution);
  private readonly transloco = inject(TranslocoService);
  private readonly railItems = inject(RailItemsService);
  private readonly railMove = inject(RailMoveService);
  private readonly workspaces = inject(WorkspaceService);
  private readonly savedInRail = inject(FeatureSwitches).workspaces.savedInRail;

  regions(): LayoutRegion[] {
    return regionsOfType(this.layout, 'rail');
  }

  rows(): CurationRow[] {
    const fallback = this.regions()[0]?.id ?? '';
    const registered = this.slots
      .resolve(this.registry.railItems(), (item) =>
        railMenuContext(item.id, this.railItems.regionOf(item.id, item.rail ?? fallback)),
      )
      .map((entry) => entry.item)
      .map((item) => ({
        id: item.id,
        label: this.transloco.translate(item.title),
        icon: item.icon,
        initials: item.initials,
        place: this.placeOf(item.id, item.rail ?? fallback),
      }));
    const known = new Set(this.registry.railItems().map((item) => item.id));
    const initials = this.workspaces.initials();
    const saved = (this.savedInRail() ? this.workspaces.workspaces() : [])
      .filter((workspace) => !known.has(workspaceRailItemId(workspace.id)))
      .map((workspace) => ({
        id: workspaceRailItemId(workspace.id),
        label: workspace.name,
        icon: 'workspaces',
        initials: initials.get(workspace.id),
        place: this.placeOf(workspaceRailItemId(workspace.id), fallback),
      }));
    return [...registered, ...saved];
  }

  place(row: CurationRow, place: string): void {
    if (place === HIDDEN) {
      this.railItems.hide(row.id);
    } else {
      this.railMove.move(row.id, place);
    }
  }

  private placeOf(itemId: string, declaredRail: string): string {
    return this.railItems.isVisible(itemId)
      ? this.railItems.regionOf(itemId, declaredRail)
      : HIDDEN;
  }
}
