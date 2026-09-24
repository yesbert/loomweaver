import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, OnInit, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DialogRef } from '../dialog/dialog-ref';
import { WideDialogFrame } from '../dialog/wide-dialog-frame';
import { PluginCatalogEntry } from './catalog/catalog-entry';
import { PluginInstallService } from './lifecycle/plugin-install.service';
import { InstalledPluginList } from './installed-plugin-list';
import { PluginStoreCard } from './plugin-store-card';
import { PluginStoreDetail } from './plugin-store-detail';
import { matchesQuery } from './catalog/catalog-search';
import { PluginCatalogEntries } from './catalog/plugin-catalog-entries';
import { PluginStoreConsent } from './lifecycle/plugin-store-consent';
import { availableUpdate } from './lifecycle/plugin-update';

export const DEFAULT_STORE_TITLE = 'settings.pluginStore';

export interface PluginStoreDialogData {
  readonly title: string;
}

@Component({
  selector: 'lw-plugin-store-dialog',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    WideDialogFrame,
    TranslocoPipe,
    InstalledPluginList,
    PluginStoreCard,
    PluginStoreDetail,
  ],
  templateUrl: './plugin-store-dialog.html',
})
export class PluginStoreDialog implements OnInit {
  private readonly ref = inject(DialogRef);
  protected readonly title =
    (this.ref.data as PluginStoreDialogData | undefined)?.title ??
    DEFAULT_STORE_TITLE;
  protected readonly installs = inject(PluginInstallService);

  private readonly catalog = inject(PluginCatalogEntries);

  private readonly consent = inject(PluginStoreConsent);

  protected readonly entries = this.catalog.entries;
  protected readonly failed = this.catalog.failed;
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
    this.catalog.load().catch(() => undefined);
  }

  protected requestInstall(entry: PluginCatalogEntry): void {
    void this.consent.confirmInstall(entry);
  }

  protected hasUpdate(entry: PluginCatalogEntry): boolean {
    return availableUpdate(this.installs.byId(entry.id), entry) !== undefined;
  }

  protected requestUpdate(entry: PluginCatalogEntry): void {
    void this.consent.confirmUpdate(entry);
  }

  protected requestUninstall(entry: PluginCatalogEntry): void {
    void this.consent.confirmUninstall(entry.id, entry.name);
  }

  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected close(): void {
    this.ref.close();
  }
}
