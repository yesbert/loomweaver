import { inject, Service, signal } from '@angular/core';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { hydrateAsync } from '../../persistence/hydrate';
import { StateSyncService } from '../../persistence/state-sync.service';
import {
  InstalledPlugin,
  PluginCatalogEntry,
  parseInstalledList,
} from '../installed-plugin';

const STORAGE_KEY = 'lw.shell.deployed-plugins';

function withoutCatalogMetadata(entry: PluginCatalogEntry): InstalledPlugin {
  return {
    id: entry.id,
    name: entry.name,
    entryUrl: entry.entryUrl,
    capabilities: entry.capabilities,
    version: entry.version,
    iconUrl: entry.iconUrl,
    level: entry.level,
  };
}

@Service()
export class PluginDeploymentService {
  private readonly store = inject(SETTINGS_STORE);

  private readonly sync = inject(StateSyncService);

  private readonly entries = signal<readonly InstalledPlugin[]>(
    parseInstalledList(this.store.peek?.(STORAGE_KEY)),
  );

  readonly deployed = this.entries.asReadonly();

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.entries.set(parseInstalledList(raw)),
    );
    this.sync.register('settings', STORAGE_KEY, (raw) =>
      this.entries.set(parseInstalledList(raw)),
    );
  }

  adopt(entries: readonly PluginCatalogEntry[]): void {
    this.persist(
      entries
        .filter((entry) => entry.deployed === true)
        .map(withoutCatalogMetadata),
    );
  }

  isDeployed(id: string): boolean {
    return this.entries().some((entry) => entry.id === id);
  }

  private persist(next: readonly InstalledPlugin[]): void {
    this.entries.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify(next));
  }
}
