import { Service } from '@angular/core';
import { persistedSetting } from '../../persistence/persisted-setting';
import {
  INSTALLED_LIST_CODEC,
  InstalledPlugin,
  PluginCatalogEntry,
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
  private readonly stored = persistedSetting(STORAGE_KEY, INSTALLED_LIST_CODEC);

  readonly deployed = this.stored.value;

  adopt(entries: readonly PluginCatalogEntry[]): void {
    this.stored.set(
      entries
        .filter((entry) => entry.deployed === true)
        .map((entry) => withoutCatalogMetadata(entry)),
    );
  }

  isDeployed(id: string): boolean {
    return this.deployed().some((entry) => entry.id === id);
  }
}
