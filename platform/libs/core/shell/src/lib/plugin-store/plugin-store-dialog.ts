import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, OnInit, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DialogRef } from '../dialog/dialog-ref';
import { PLUGIN_CATALOG } from './catalog/plugin-catalog';
import { PluginCatalogEntry } from './installed-plugin';
import { PluginInstallService } from './lifecycle/plugin-install.service';
import { PluginStoreTitle } from './plugin-store-title';
import { LwButton } from '../elements/button/lw-button';
import { InstalledPluginList } from './installed-plugin-list';
import { PluginStoreCard } from './plugin-store-card';
import { PluginStoreDetail } from './plugin-store-detail';
import { loadCatalogEntries, matchesQuery } from './catalog/catalog-entries';
import { confirmInstall } from './lifecycle/install-consent';
import { injectStoreConsentDeps } from './lifecycle/consent-deps';
import { confirmUninstall } from './lifecycle/uninstall-confirm';
import { confirmUpdate } from './lifecycle/update-consent';
import { availableUpdate } from './lifecycle/plugin-update';

@Component({
  selector: 'lw-plugin-store-dialog',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    TranslocoPipe,
    LwButton,
    InstalledPluginList,
    PluginStoreCard,
    PluginStoreDetail,
  ],
  templateUrl: './plugin-store-dialog.html',
})
export class PluginStoreDialog implements OnInit {
  protected readonly ref = inject(DialogRef);
  protected readonly title = inject(PluginStoreTitle).current;
  protected readonly installs = inject(PluginInstallService);

  private readonly catalog = inject(PLUGIN_CATALOG, { optional: true });

  private readonly consentDeps = injectStoreConsentDeps();

  protected readonly entries = signal<
    readonly PluginCatalogEntry[] | undefined
  >(undefined);
  protected readonly failed = signal(false);
  protected readonly view = signal<'browse' | 'installed'>('browse');
  protected readonly query = signal('');
  protected readonly selectedId = signal<string | undefined>(undefined);

  protected readonly filtered = computed<readonly PluginCatalogEntry[]>(() => {
    const list = (this.entries() ?? []).filter((entry) =>
      matchesQuery(
        [entry.name, entry.author, entry.category, entry.description],
        this.query(),
      ),
    );
    return list.toSorted(
      (a, b) =>
        (b.downloads ?? 0) - (a.downloads ?? 0) || a.name.localeCompare(b.name),
    );
  });

  protected readonly selected = computed<PluginCatalogEntry | undefined>(() =>
    this.filtered().find((entry) => entry.id === this.selectedId()),
  );

  ngOnInit(): void {
    void this.load();
  }

  protected requestInstall(entry: PluginCatalogEntry): void {
    void confirmInstall(
      this.consentDeps,
      entry,
    );
  }

  protected hasUpdate(entry: PluginCatalogEntry): boolean {
    return availableUpdate(this.installs.byId(entry.id), entry) !== undefined;
  }

  protected requestUpdate(entry: PluginCatalogEntry): void {
    void confirmUpdate(
      this.consentDeps,
      entry,
    );
  }

  protected requestUninstall(entry: PluginCatalogEntry): void {
    void confirmUninstall(
      this.consentDeps,
      entry.id,
      entry.name,
    );
  }

  protected close(): void {
    this.ref.close();
  }

  private async load(): Promise<void> {
    const entries = await loadCatalogEntries(this.catalog);
    if (entries === undefined) {
      this.failed.set(true);
      return;
    }
    this.entries.set(entries);
  }
}
