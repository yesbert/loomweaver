import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Capability } from '@loomweaver/plugin-sdk';
import {
  CapabilityGrantService,
  PluginCapabilityState,
} from '../../permissions/capability-grant.service';
import { PluginEnablementService } from './plugin-enablement.service';
import { PluginDisableGuard } from './plugin-disable-guard';
import { PluginDeploymentService } from '../../plugin-store/lifecycle/plugin-deployment.service';
import {
  PluginRung,
  PluginIsolationLevelService,
} from '../../foundation/plugin-isolation-level';

const RUNG_NOTES: Readonly<Record<PluginRung, string>> = {
  trusted: 'settings.pluginLevel.trusted',
  isolated: 'settings.pluginLevel.isolated',
  embedded: 'settings.pluginLevel.embedded',
};

interface PluginRow {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly deployed: boolean;
  readonly required: boolean;
  readonly rungNote: string;
  readonly capabilities: readonly PluginCapabilityState[];
}

@Component({
  selector: 'lw-permissions-settings',
  imports: [TranslocoPipe],
  templateUrl: './permissions-settings.html',
})
export class PermissionsSettings {
  private readonly grants = inject(CapabilityGrantService);
  private readonly enablement = inject(PluginEnablementService);
  private readonly disableGuard = inject(PluginDisableGuard);
  private readonly deployment = inject(PluginDeploymentService);
  private readonly isolation = inject(PluginIsolationLevelService);

  protected readonly plugins = computed<readonly PluginRow[]>(() =>
    this.rows().filter((row) => this.canBePermitted(row)),
  );

  private readonly rows = computed<readonly PluginRow[]>(() => {
    const caps = this.grants.permissions();
    return this.enablement.plugins().map((plugin) => {
      const deployed = this.deployment.isDeployed(plugin.id);
      const required = this.enablement.isRequired(plugin.id);
      return {
        ...plugin,
        deployed,
        required,
        rungNote: RUNG_NOTES[this.isolation.rungOf(plugin.id)],
        capabilities:
          caps.find((entry) => entry.pluginId === plugin.id)?.capabilities ??
          [],
      };
    });
  });

  protected togglePlugin(id: string, event: Event): void {
    const toggle = event.target as HTMLInputElement;
    void this.disableGuard
      .requestEnabled(id, toggle.checked)
      .then((changed) => {
        if (!changed) {
          toggle.checked = true;
        }
      });
  }

  protected toggleCapability(
    pluginId: string,
    capability: Capability,
    event: Event,
  ): void {
    this.grants.setGranted(
      pluginId,
      capability,
      (event.target as HTMLInputElement).checked,
    );
  }

  private canBePermitted(row: PluginRow): boolean {
    return row.capabilities.length > 0 || !(row.deployed || row.required);
  }
}
