import { inject, Service } from '@angular/core';
import { View } from '../../layout/view';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { UserOrderService } from '../reorder/user-order.service';

function panelViewsContainerId(regionId: string): string {
  return `panel-views:${regionId}`;
}

@Service()
export class PanelViewsService {
  private readonly registry = inject(ContributionRegistry);
  private readonly order = inject(UserOrderService);

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
}
