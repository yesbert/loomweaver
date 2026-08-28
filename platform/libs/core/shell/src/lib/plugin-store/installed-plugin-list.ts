import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SettingsService } from '../settings/settings.service';
import { PLUGIN_CATALOG } from './catalog/plugin-catalog';
import { PluginCatalogEntry } from './installed-plugin';
import { PluginDisableGuard } from './lifecycle/plugin-disable-guard';
import { PluginEnablementService } from './lifecycle/plugin-enablement.service';
import { PluginInstallService } from './lifecycle/plugin-install.service';
import { PluginDeploymentService } from './lifecycle/plugin-deployment.service';
import { loadCatalogEntries, matchesQuery } from './catalog/catalog-entries';
import { confirmUninstall } from './lifecycle/uninstall-confirm';
import { injectStoreConsentDeps } from './lifecycle/consent-deps';
import { confirmUpdate } from './lifecycle/update-consent';
import { availableUpdate } from './lifecycle/plugin-update';

const COMMUNITY_GROUP = 'settings.group.community';

interface InstalledRow {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly author?: string;
  readonly category?: string;
  readonly iconUrl?: string;
  readonly enabled: boolean;
  readonly provided: boolean;
  readonly settingsSectionId?: string;
  readonly update?: PluginCatalogEntry;
}

@Component({
  selector: 'lw-installed-plugin-list',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './installed-plugin-list.html',
})
export class InstalledPluginList implements OnInit {
  private readonly catalog = inject(PLUGIN_CATALOG, { optional: true });

  private readonly settings = inject(SettingsService);

  private readonly enablement = inject(PluginEnablementService);

  private readonly disableGuard = inject(PluginDisableGuard);

  protected readonly installs = inject(PluginInstallService);

  protected readonly deployment = inject(PluginDeploymentService);

  private readonly consentDeps = injectStoreConsentDeps();

  readonly query = input('');

  readonly settingsOpened = output<void>();

  private readonly entries = signal<readonly PluginCatalogEntry[]>([]);

  protected readonly rows = computed<readonly InstalledRow[]>(() => {
    const catalog = new Map(this.entries().map((entry) => [entry.id, entry]));
    const sections = this.settings.all();
    const deployed = this.deployment.deployed();
    const provided = new Set(deployed.map((plugin) => plugin.id));
    return [
      ...deployed,
      ...this.installs.installed().filter((plugin) => !provided.has(plugin.id)),
    ]
      .map((plugin) => {
        const entry = catalog.get(plugin.id);
        const isProvided = provided.has(plugin.id);
        return {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          author: entry?.author,
          category: entry?.category,
          iconUrl: plugin.iconUrl ?? entry?.iconUrl,
          enabled: isProvided || this.enablement.isEnabled(plugin.id),
          provided: isProvided,
          settingsSectionId: sections.find(
            (section) =>
              section.group === COMMUNITY_GROUP &&
              section.id.startsWith(`${plugin.id}.`),
          )?.id,
          update: isProvided ? undefined : availableUpdate(plugin, entry),
        };
      })
      .filter((row) =>
        matchesQuery([row.name, row.author, row.category], this.query()),
      );
  });

  ngOnInit(): void {
    void this.load();
  }

  protected togglePlugin(id: string, event: Event): void {
    this.disableGuard.toggle(id, event.target as HTMLInputElement);
  }

  protected update(entry: PluginCatalogEntry): void {
    void confirmUpdate(this.consentDeps, entry);
  }

  protected uninstall(row: InstalledRow): void {
    void confirmUninstall(this.consentDeps, row.id, row.name);
  }

  protected openPluginSettings(sectionId: string): void {
    this.settingsOpened.emit();
    this.settings.open(sectionId);
  }

  private async load(): Promise<void> {
    this.entries.set((await loadCatalogEntries(this.catalog)) ?? []);
  }
}
