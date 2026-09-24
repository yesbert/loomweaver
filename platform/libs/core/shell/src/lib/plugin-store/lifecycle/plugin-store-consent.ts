import { inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Capability } from '@loomweaver/plugin-sdk';
import { DialogService } from '../../dialog/dialog.service';
import { PluginDisableGuard } from '../../plugin/enablement/plugin-disable-guard';
import { PluginCatalogEntry } from '../catalog/catalog-entry';
import { PluginInstallService } from './plugin-install.service';
import { addedCapabilities } from './plugin-update';

@Service()
export class PluginStoreConsent {
  private readonly dialogs = inject(DialogService);
  private readonly transloco = inject(TranslocoService);
  private readonly installs = inject(PluginInstallService);
  private readonly disableGuard = inject(PluginDisableGuard);

  async confirmInstall(entry: PluginCatalogEntry): Promise<void> {
    const accepted = await this.dialogs.confirm({
      title: this.transloco.translate('settings.storeInstallTitle', {
        name: entry.name,
      }),
      message: this.installMessage(entry),
      confirmLabel: this.transloco.translate('settings.storeInstall'),
      icon: entry.icon ?? 'plugin',
    });
    if (!accepted) {
      return;
    }
    this.installs.install(entry);
  }

  async confirmUpdate(entry: PluginCatalogEntry): Promise<void> {
    const installed = this.installs.byId(entry.id);
    if (!installed) {
      return;
    }
    const added = addedCapabilities(entry, installed);
    if (added.length > 0) {
      const accepted = await this.dialogs.confirm({
        title: this.transloco.translate('settings.storeUpdateTitle', {
          name: entry.name,
        }),
        message: this.updateMessage(entry, added),
        confirmLabel: this.transloco.translate('settings.storeUpdate'),
        icon: entry.icon ?? 'plugin',
      });
      if (!accepted) {
        return;
      }
    }
    if (!(await this.disableGuard.confirmRemoval(entry.id))) {
      return;
    }
    this.installs.update(entry);
  }

  async confirmUninstall(id: string, name: string): Promise<void> {
    const accepted = await this.dialogs.confirm({
      title: this.transloco.translate('settings.storeUninstallTitle', { name }),
      message: this.transloco.translate('settings.storeUninstallConfirm', {
        name,
      }),
      confirmLabel: this.transloco.translate('settings.storeUninstall'),
      tone: 'danger',
    });
    if (!accepted) {
      return;
    }
    if (!(await this.disableGuard.confirmRemoval(id))) {
      return;
    }
    this.installs.uninstall(id);
  }

  private installMessage(entry: PluginCatalogEntry): string {
    const paragraphs: string[] = [];
    if (entry.description) {
      paragraphs.push(entry.description, '');
    }
    const capabilities = entry.capabilities ?? [];
    if (capabilities.length === 0) {
      paragraphs.push(
        this.transloco.translate('settings.storeConsentNone', {
          name: entry.name,
        }),
      );
      return paragraphs.join('\n');
    }
    paragraphs.push(
      this.transloco.translate('settings.storeConsent', { name: entry.name }),
      '',
      ...this.permissionLines(capabilities),
    );
    return paragraphs.join('\n');
  }

  private updateMessage(
    entry: PluginCatalogEntry,
    added: readonly Capability[],
  ): string {
    return [
      this.transloco.translate('settings.storeUpdateConsent', {
        name: entry.name,
        version: entry.version ?? '',
      }),
      '',
      ...this.permissionLines(added),
    ].join('\n');
  }

  private permissionLines(capabilities: readonly Capability[]): string[] {
    return capabilities.map((cap) => {
      const label = this.transloco.translate(`settings.capability.${cap}`);
      const description = this.transloco.translate(
        `settings.capabilityDesc.${cap}`,
      );
      return `- **${label}** — ${description}`;
    });
  }
}
