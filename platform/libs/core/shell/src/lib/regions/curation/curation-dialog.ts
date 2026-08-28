import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DialogRef } from '../../dialog/dialog-ref';
import { SHELL_LAYOUT } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { CommandService } from '../../commands/command.service';
import {
  RailItemsService,
  workspaceRailItemId,
} from '../rail/rail-items.service';
import { RailMoveService } from '../rail/rail-move.service';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { ViewVisibilityService } from '../panel/view-visibility.service';
import { WorkspaceService } from '../../workspace/workspace.service';
import { SHELL_FEATURES } from '../../foundation/shell-features';

export type CurationKind = 'rail' | 'views';

export interface CurationDialogData {
  readonly kind: CurationKind;
}

export const HIDDEN = 'hidden';

export const CURATION_CHROME: Record<
  CurationKind,
  { readonly title: string; readonly icon: string }
> = {
  rail: { title: 'rail.customize', icon: 'edit' },
  views: { title: 'panel.customizeViews', icon: 'navigator' },
};

interface CurationRow {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly initials?: string;
  readonly place: string;
}

interface CurationPlace {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'lw-curation-dialog',
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './curation-dialog.html',
})
export class CurationDialog {
  private readonly ref = inject(DialogRef);
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);
  private readonly commands = inject(CommandService);
  private readonly transloco = inject(TranslocoService);
  private readonly railItems = inject(RailItemsService);
  private readonly railMove = inject(RailMoveService);
  private readonly paneTree = inject(PaneTreeService);
  private readonly visibility = inject(ViewVisibilityService);
  private readonly workspaces = inject(WorkspaceService);
  private readonly features = inject(SHELL_FEATURES);

  protected readonly query = signal('');

  private readonly kind =
    (this.ref.data as CurationDialogData | undefined)?.kind ?? 'rail';

  protected readonly chrome = CURATION_CHROME[this.kind];

  private readonly regions = computed(() =>
    this.layout.regions.filter((region) =>
      this.kind === 'rail' ? region.type === 'rail' : region.type === 'panel',
    ),
  );

  protected readonly places = computed<CurationPlace[]>(() => {
    const regions = this.regions();
    const hidden = {
      id: HIDDEN,
      label: this.transloco.translate('curation.hidden'),
    };
    if (regions.length < 2) {
      return [
        hidden,
        {
          id: regions[0]?.id ?? HIDDEN,
          label: this.transloco.translate('curation.shown'),
        },
      ];
    }
    return [
      hidden,
      ...regions.map((region) => ({
        id: region.id,
        label: this.transloco.translate(
          region.dock === 'right' ? 'curation.right' : 'curation.left',
        ),
      })),
    ];
  });

  protected readonly rows = computed<CurationRow[]>(() => {
    const all = this.kind === 'rail' ? this.railRows() : this.viewRows();
    const query = this.query().trim().toLowerCase();
    return query
      ? all.filter((row) => row.label.toLowerCase().includes(query))
      : all;
  });

  protected place(row: CurationRow, place: string): void {
    if (place === row.place) {
      return;
    }
    if (this.kind === 'rail') {
      if (place === HIDDEN) {
        this.railItems.hide(row.id);
      } else {
        this.railMove.move(row.id, place);
      }
      return;
    }
    if (place === HIDDEN) {
      this.visibility.hide(row.id);
    } else {
      this.visibility.reveal(row.id, place);
    }
  }

  private railRows(): CurationRow[] {
    const fallback = this.regions()[0]?.id ?? '';
    const registered = this.registry
      .railItems()
      .filter((item) => this.auth.visible(item.access))
      .filter(
        (item) =>
          item.workspace !== undefined || this.commands.triggerable(item),
      )
      .map((item) => ({
        id: item.id,
        label: this.transloco.translate(item.title),
        icon: item.icon,
        initials: item.initials,
        place: this.railPlace(item.id, item.rail ?? fallback),
      }));
    const known = new Set(this.registry.railItems().map((item) => item.id));
    const initials = this.workspaces.initials();
    const saved = (this.features.workspaces.savedInRail
      ? this.workspaces.workspaces()
      : [])
      .filter((workspace) => !known.has(workspaceRailItemId(workspace.id)))
      .map((workspace) => ({
        id: workspaceRailItemId(workspace.id),
        label: workspace.name,
        icon: 'workspaces',
        initials: initials.get(workspace.id),
        place: this.railPlace(workspaceRailItemId(workspace.id), fallback),
      }));
    return [...registered, ...saved];
  }

  private railPlace(itemId: string, declaredRail: string): string {
    return this.railItems.isVisible(itemId)
      ? this.railItems.regionOf(itemId, declaredRail)
      : HIDDEN;
  }

  private viewRows(): CurationRow[] {
    const panels = new Set(this.regions().map((region) => region.id));
    return this.registry
      .views()
      .filter((view) => this.auth.meets(view.access))
      .map((view) => ({ view, holder: this.holderOf(view.id) }))
      .filter(
        ({ view, holder }) =>
          panels.has(view.region) || (holder !== null && panels.has(holder)),
      )
      .map(({ view, holder }) => ({
        id: view.id,
        label: this.transloco.translate(view.title),
        icon: view.icon,
        place: holder !== null && panels.has(holder) ? holder : HIDDEN,
      }));
  }

  private holderOf(viewId: string): string | null {
    return this.paneTree.sourceOf(VIEW_PANE_PREFIX + viewId)?.dock ?? null;
  }
}
