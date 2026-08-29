import { inject, Service } from '@angular/core';
import { View } from '../../layout/view';
import { SHELL_LAYOUT } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { UserOrderService } from '../reorder/user-order.service';

function panelViewsContainerId(regionId: string): string {
  return `panel-views:${regionId}`;
}

export interface ViewCandidate {
  readonly view: View;
  readonly here: boolean;
}

@Service()
export class PanelViewsService {
  private readonly registry = inject(ContributionRegistry);
  private readonly order = inject(UserOrderService);
  private readonly auth = inject(AuthContext);
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly paneTree = inject(PaneTreeService);

  viewsInRegion(regionId: string): View[] {
    const declared = this.registry
      .views()
      .filter((view) => view.region === regionId)
      .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return this.order.applyOrder(
      panelViewsContainerId(regionId),
      declared,
      (view) => view.id,
    );
  }

  candidatesFor(regionId: string): ViewCandidate[] {
    const panelRegions = new Set(
      this.layout.regions
        .filter((region) => region.type === 'panel')
        .map((region) => region.id),
    );
    return this.registry
      .views()
      .filter((view) => this.auth.meets(view.access))
      .map((view) => ({ view, holder: this.holderOf(view.id) }))
      .filter(
        ({ view, holder }) =>
          holder === regionId ||
          (panelRegions.has(view.region) &&
            (holder === null || !panelRegions.has(holder))),
      )
      .map(({ view, holder }) => ({ view, here: holder === regionId }))
      .toSorted(
        (a, b) =>
          Number(b.here) - Number(a.here) ||
          (a.view.order ?? 0) - (b.view.order ?? 0),
      );
  }

  private holderOf(viewId: string): string | null {
    return this.paneTree.sourceOf(VIEW_PANE_PREFIX + viewId)?.dock ?? null;
  }
}
