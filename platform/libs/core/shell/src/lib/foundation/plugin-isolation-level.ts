import { InjectionToken, Service, signal } from '@angular/core';

/**
 * How much the browser holds a frame plugin back. **Isolated** strips the frame of an origin, which
 * is what denies it the hosting document, any storage and any session the browser would carry for
 * it. **Embedded** lets it keep an origin, and with it whatever the browser grants that origin — a
 * separation of deployments rather than of privileges.
 *
 * Isolated is the default: a plugin whose level was never stated runs isolated.
 */
export type PluginIsolationLevel = 'isolated' | 'embedded';

export const DEFAULT_ISOLATION_LEVEL: PluginIsolationLevel = 'isolated';

export type PluginRung = 'trusted' | PluginIsolationLevel;

export const CATALOG_MAX_ISOLATION_LEVEL = new InjectionToken<PluginIsolationLevel>(
  'lw.catalog-max-isolation-level',
  { providedIn: 'root', factory: () => DEFAULT_ISOLATION_LEVEL },
);

export function exceedsLevel(
  asked: PluginIsolationLevel,
  cap: PluginIsolationLevel,
): boolean {
  return asked === 'embedded' && cap === 'isolated';
}

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
