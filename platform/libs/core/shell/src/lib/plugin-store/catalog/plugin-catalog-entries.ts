import { computed, inject, Service, signal } from '@angular/core';
import { PLUGIN_CATALOG } from './plugin-catalog';
import { PluginCatalogEntry } from './catalog-entry';

type CatalogState =
  | { readonly status: 'loading' }
  | { readonly status: 'failed' }
  | {
      readonly status: 'loaded';
      readonly entries: readonly PluginCatalogEntry[];
    };

@Service()
export class PluginCatalogEntries {
  private readonly catalog = inject(PLUGIN_CATALOG, { optional: true });
  private readonly state = signal<CatalogState>(
    this.catalog ? { status: 'loading' } : { status: 'loaded', entries: [] },
  );

  readonly entries = computed(() => {
    const state = this.state();
    return state.status === 'loaded' ? state.entries : undefined;
  });

  readonly failed = computed(() => this.state().status === 'failed');

  private requested = false;

  ensureLoaded(): void {
    if (!this.requested) {
      this.load().catch(() => undefined);
    }
  }

  async load(): Promise<readonly PluginCatalogEntry[]> {
    if (!this.catalog) {
      return [];
    }
    this.requested = true;
    this.state.set({ status: 'loading' });
    try {
      const entries = await this.catalog.load();
      this.state.set({ status: 'loaded', entries });
      return entries;
    } catch (error) {
      this.state.set({ status: 'failed' });
      throw error;
    }
  }
}
