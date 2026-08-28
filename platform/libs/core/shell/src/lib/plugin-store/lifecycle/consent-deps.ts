import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Capability } from '@loomweaver/plugin-sdk';
import { DialogService } from '../../dialog/dialog.service';
import { PluginDisableGuard } from './plugin-disable-guard';
import { PluginInstallService } from './plugin-install.service';

export interface StoreConsentDeps {
  readonly dialogs: DialogService;
  readonly transloco: TranslocoService;
  readonly installs: PluginInstallService;
  readonly disableGuard: PluginDisableGuard;
}

export function injectStoreConsentDeps(): StoreConsentDeps {
  return {
    dialogs: inject(DialogService),
    transloco: inject(TranslocoService),
    installs: inject(PluginInstallService),
    disableGuard: inject(PluginDisableGuard),
  };
}

export function consentLine(
  transloco: TranslocoService,
  cap: Capability,
): string {
  const label = transloco.translate(`settings.capability.${cap}`);
  const description = transloco.translate(`settings.capabilityDesc.${cap}`);
  return `- **${label}** — ${description}`;
}
