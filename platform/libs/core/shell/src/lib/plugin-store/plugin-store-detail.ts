import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, effect, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PluginCatalogEntry } from './installed-plugin';
import { PluginInstallService } from './lifecycle/plugin-install.service';
import { formatCount, formatUpdated } from './format';
import { availableUpdate } from './lifecycle/plugin-update';

@Component({
  selector: 'lw-plugin-store-detail',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './plugin-store-detail.html',
})
export class PluginStoreDetail {
  readonly entry = input.required<PluginCatalogEntry>();
  readonly install = output<PluginCatalogEntry>();
  readonly uninstall = output<PluginCatalogEntry>();
  readonly updateRequested = output<PluginCatalogEntry>();

  protected readonly installs = inject(PluginInstallService);
  private readonly transloco = inject(TranslocoService);

  protected readonly readme = signal<string | undefined>(undefined);

  protected readonly update = computed(() =>
    availableUpdate(this.installs.byId(this.entry().id), this.entry()),
  );

  constructor() {
    effect(() => {
      const entry = this.entry();
      this.readme.set(undefined);
      if (entry.readmeUrl) {
        void this.loadReadme(entry.id, entry.readmeUrl);
      }
    });
  }

  protected count(downloads: number): string {
    return formatCount(this.transloco.getActiveLang(), downloads);
  }

  protected updated(iso: string): string {
    return formatUpdated(this.transloco.getActiveLang(), iso);
  }

  private async loadReadme(entryId: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return;
      }
      const text = await response.text();
      if (this.entry().id === entryId) {
        this.readme.set(text);
      }
    } catch {
      return;
    }
  }
}
