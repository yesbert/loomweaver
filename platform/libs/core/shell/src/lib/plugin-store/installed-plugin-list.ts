import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SettingsService } from '../settings/settings.service';
import { PluginCatalogEntry } from './catalog/catalog-entry';
import { PluginDisableGuard } from '../plugin/enablement/plugin-disable-guard';
import { PluginEnablementService } from '../plugin/enablement/plugin-enablement.service';
import { PluginInstallService } from './lifecycle/plugin-install.service';
import { PluginDeploymentService } from './lifecycle/plugin-deployment.service';
import { matchesQuery } from './catalog/catalog-search';
import { PluginCatalogEntries } from './catalog/plugin-catalog-entries';
import { PluginStoreConsent } from './lifecycle/plugin-store-consent';
import { availableUpdate } from './lifecycle/plugin-update';
import { frameSettingsGroup } from '../plugin/frame/frame-settings';

interface InstalledRow {
  readonly id: string;
  readonly name: string;
  readonly version?: string;
  readonly author?: string;
  readonly category?: string;
  readonly iconUrl?: string;
  readonly enabled: boolean;
  readonly deployed: boolean;
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
  private readonly catalog = inject(PluginCatalogEntries);

  private readonly settings = inject(SettingsService);

  private readonly enablement = inject(PluginEnablementService);

  private readonly disableGuard = inject(PluginDisableGuard);

  protected readonly installs = inject(PluginInstallService);

  protected readonly deployment = inject(PluginDeploymentService);

  private readonly consent = inject(PluginStoreConsent);

  readonly query = input('');

  readonly settingsOpened = output<void>();

  protected readonly rows = computed<readonly InstalledRow[]>(() => {
    const catalog = new Map(
      (this.catalog.entries() ?? []).map((entry) => [entry.id, entry]),
    );
    const sections = this.settings.all();
    const deployed = this.deployment.deployed();
    const deployedIds = new Set(deployed.map((plugin) => plugin.id));
    return [
      ...deployed,
      ...this.installs
        .installed()
        .filter((plugin) => !deployedIds.has(plugin.id)),
    ]
      .map((plugin) => {
        const entry = catalog.get(plugin.id);
        const isDeployed = deployedIds.has(plugin.id);
        return {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          author: entry?.author,
          category: entry?.category,
          iconUrl: plugin.iconUrl ?? entry?.iconUrl,
          enabled: this.enablement.isEnabled(plugin.id),
          deployed: isDeployed,
          settingsSectionId: sections.find(
            (section) =>
              section.group === frameSettingsGroup(this.installs, plugin.id) &&
              section.id.startsWith(`${plugin.id}.`),
          )?.id,
          update: isDeployed ? undefined : availableUpdate(plugin, entry),
        };
      })
      .filter((row) =>
        matchesQuery([row.name, row.author, row.category], this.query()),
      );
  });

  ngOnInit(): void {
    this.catalog.ensureLoaded();
  }

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

  protected update(entry: PluginCatalogEntry): void {
    void this.consent.confirmUpdate(entry);
  }

  protected uninstall(row: InstalledRow): void {
    void this.consent.confirmUninstall(row.id, row.name);
  }

  protected openPluginSettings(sectionId: string): void {
    this.settingsOpened.emit();
    this.settings.open(sectionId);
  }
}
