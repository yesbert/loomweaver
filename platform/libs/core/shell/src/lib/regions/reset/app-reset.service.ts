import { inject, InjectionToken, Service } from '@angular/core';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { SurfaceCloseGuard } from '../pane/close/surface-close-guard';
import { RetentionCandidates } from '../pane/retention/retention-candidates';
import { PanelSizeService } from '../panel/panel-size.service';
import { PanelState } from '../panel/panel-state';
import { RailItemsService } from '../rail/rail-items.service';
import { UserOrderService } from '../reorder/user-order.service';
import { ViewInstanceService } from '../../views/view-instance.service';

/**
 * Resets every workspace after asking about unsaved work once, and answers whether it was allowed.
 * Provided by the composition root so the application reset can include the workspaces without the
 * frame's slice reaching into theirs.
 */
export const APP_RESET_WORKSPACES = new InjectionToken<() => Promise<boolean>>(
  'lw.app-reset-workspaces',
);

@Service()
export class AppResetService {
  private readonly registry = inject(ContributionRegistry);
  private readonly railItems = inject(RailItemsService);
  private readonly panels = inject(PanelState);
  private readonly panelSizes = inject(PanelSizeService);
  private readonly order = inject(UserOrderService);
  private readonly instances = inject(ViewInstanceService);
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly retention = inject(RetentionCandidates);
  private readonly resetWorkspaces = inject(APP_RESET_WORKSPACES, {
    optional: true,
  });

  async reset(options: { workspaces?: boolean } = {}): Promise<boolean> {
    const allowed =
      options.workspaces && this.resetWorkspaces
        ? await this.resetWorkspaces()
        : await this.closeGuard.confirmDiscard(this.retention.all());
    if (!allowed) {
      return false;
    }
    this.railItems.reset();
    this.panels.reset();
    this.panelSizes.reset();
    this.order.reset();
    for (const view of this.registry.views()) {
      this.instances.reset(view.id);
    }
    return true;
  }
}
