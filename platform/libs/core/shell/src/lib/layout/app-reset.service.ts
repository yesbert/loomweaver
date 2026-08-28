import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../plugin/contribution-registry';
import { PanelSizeService } from '../regions/panel/panel-size.service';
import { PanelState } from '../regions/panel/panel-state';
import { RailItemsService } from '../regions/rail/rail-items.service';
import { UserOrderService } from '../regions/reorder/user-order.service';
import { ViewInstanceService } from '../views/view-instance.service';

@Service()
export class AppResetService {
  private readonly registry = inject(ContributionRegistry);
  private readonly railItems = inject(RailItemsService);
  private readonly panels = inject(PanelState);
  private readonly panelSizes = inject(PanelSizeService);
  private readonly order = inject(UserOrderService);
  private readonly instances = inject(ViewInstanceService);

  reset(): void {
    this.railItems.reset();
    this.panels.reset();
    this.panelSizes.reset();
    this.order.reset();
    for (const view of this.registry.views()) {
      this.instances.reset(view.id);
    }
  }
}
