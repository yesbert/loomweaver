import { inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { LayoutRegion, SHELL_LAYOUT } from '../../layout/layout';
import { regionsOfType } from '../../layout/layout-queries';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { viewPanePath } from '../pane/tree/pane-address';
import { ViewVisibilityService } from '../panel/view-visibility.service';
import { CurationRow, CurationSource, HIDDEN } from './curation-source';

@Service()
export class ViewCuration implements CurationSource {
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);
  private readonly transloco = inject(TranslocoService);
  private readonly paneTree = inject(PaneTreeService);
  private readonly visibility = inject(ViewVisibilityService);

  regions(): LayoutRegion[] {
    return regionsOfType(this.layout, 'panel');
  }

  rows(): CurationRow[] {
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

  place(row: CurationRow, place: string): void {
    if (place === HIDDEN) {
      this.visibility.hide(row.id);
    } else {
      this.visibility.reveal(row.id, place);
    }
  }

  private holderOf(viewId: string): string | null {
    return this.paneTree.sourceOf(viewPanePath(viewId))?.dock ?? null;
  }
}
