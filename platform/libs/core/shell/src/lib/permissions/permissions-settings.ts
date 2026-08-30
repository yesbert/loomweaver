import { Component, computed, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Capability } from '@loomweaver/plugin-sdk';
import {
  CapabilityGrantService,
  PluginCapabilityState,
} from './capability-grant.service';
import { PluginEnablementService } from '../plugin-store/lifecycle/plugin-enablement.service';
import { PluginDisableGuard } from '../plugin-store/lifecycle/plugin-disable-guard';
import { PluginDeploymentService } from '../plugin-store/lifecycle/plugin-deployment.service';
import {
  PluginRung,
  PluginIsolationLevelService,
} from '../foundation/plugin-isolation-level';

const RUNG_NOTES: Readonly<Record<PluginRung, string>> = {
  trusted: 'settings.pluginLevel.trusted',
  isolated: 'settings.pluginLevel.isolated',
  embedded: 'settings.pluginLevel.embedded',
};

function rungNoteKey(rung: PluginRung): string | null {
  return RUNG_NOTES[rung] ?? null;
}

interface PluginRow {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly provided: boolean;
  readonly required: boolean;
  readonly rungNote: string | null;
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

  protected readonly plugins = computed<readonly PluginRow[]>(() => {
    const caps = this.grants.permissions();
    return this.enablement.plugins().map((plugin) => {
      const provided = this.deployment.isDeployed(plugin.id);
      const required = this.enablement.isRequired(plugin.id);
      return {
        ...plugin,
        enabled: provided || plugin.enabled,
        provided,
        required,
        rungNote: rungNoteKey(this.isolation.rungOf(plugin.id)),
        capabilities:
          caps.find((entry) => entry.pluginId === plugin.id)?.capabilities ??
          [],
      };
    });
  });

  protected togglePlugin(id: string, event: Event): void {
    this.disableGuard.toggle(id, event.target as HTMLInputElement);
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
}
