import { inject, Service } from '@angular/core';
import { CapabilityGrantService } from '../../permissions/capability-grant.service';
import { PluginEnablementService } from './plugin-enablement.service';

@Service()
export class PluginUserChoices {
  private readonly enablement = inject(PluginEnablementService);

  private readonly grants = inject(CapabilityGrantService);

  forget(pluginId: string): void {
    this.enablement.setEnabled(pluginId, true);
    this.grants.restoreAll(pluginId);
  }
}
