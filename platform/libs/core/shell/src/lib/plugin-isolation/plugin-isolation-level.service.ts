import { Service, signal } from '@angular/core';
import {
  DEFAULT_ISOLATION_LEVEL,
  PluginIsolationLevel,
  PluginRung,
} from '../foundation/plugin-isolation-level';

@Service()
export class PluginIsolationLevelService {
  private readonly levels = signal<ReadonlyMap<string, PluginIsolationLevel>>(
    new Map(),
  );

  register(pluginId: string, level: PluginIsolationLevel): void {
    const next = new Map(this.levels());
    next.set(pluginId, level);
    this.levels.set(next);
  }

  unregister(pluginId: string): void {
    if (!this.levels().has(pluginId)) {
      return;
    }
    const next = new Map(this.levels());
    next.delete(pluginId);
    this.levels.set(next);
  }

  levelOf(pluginId: string | undefined): PluginIsolationLevel {
    if (pluginId === undefined) {
      return DEFAULT_ISOLATION_LEVEL;
    }
    return this.levels().get(pluginId) ?? DEFAULT_ISOLATION_LEVEL;
  }

  rungOf(pluginId: string): PluginRung {
    return this.levels().get(pluginId) ?? 'trusted';
  }
}
