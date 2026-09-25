import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, effect, inject, input, output, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PluginCatalogEntry } from './catalog/catalog-entry';
import { PluginInstallService } from './lifecycle/plugin-install.service';
import { PluginDeploymentService } from './lifecycle/plugin-deployment.service';
import { CatalogCountPipe, RelativeDatePipe } from './catalog-figures';
import { LwButton } from '../elements/button/lw-button';
import { availableUpdate } from './lifecycle/plugin-update';

@Component({
  selector: 'lw-plugin-store-detail',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe, CatalogCountPipe, RelativeDatePipe, LwButton],
  templateUrl: './plugin-store-detail.html',
})
export class PluginStoreDetail {
  readonly entry = input.required<PluginCatalogEntry>();
  readonly install = output<PluginCatalogEntry>();
  readonly uninstall = output<PluginCatalogEntry>();
  readonly updateRequested = output<PluginCatalogEntry>();

  protected readonly installs = inject(PluginInstallService);
  protected readonly deployment = inject(PluginDeploymentService);

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
