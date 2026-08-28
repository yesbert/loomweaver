import { inject, Service, signal } from '@angular/core';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { hydrateAsync } from '../../persistence/hydrate';
import { StateSyncService } from '../../persistence/state-sync.service';
import { PluginStateService } from '../../plugin/plugin-state.service';
import {
  InstalledPlugin,
  isSameOriginUrl,
  parseInstalledList,
  parseInstalledPlugin,
} from '../installed-plugin';

const STORAGE_KEY = 'lw.shell.installed-plugins';

/**
 * The user's installed community plugins. Holds only the state: which catalog entries the
 * user installed, persisted user-locally through the {@link SETTINGS_STORE} — a product that wants
 * tenant-wide or server-held installs implements that in its store backend, the seam does not change.
 * The {@link FramePluginRuntime} reconciles activation against {@link installed} reactively, so an
 * install spawns the plugin at once and an uninstall unloads it, both without a reload. It never
 * depends on the runtime, which keeps the dependency one-way (the {@link PluginEnablementService}
 * precedent).
 */
@Service()
export class PluginInstallService {
  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly pluginState = inject(PluginStateService);

  private readonly entries = signal<readonly InstalledPlugin[]>(
    parseInstalledList(this.store.peek?.(STORAGE_KEY)),
  );

  private composedIds: ReadonlySet<string> = new Set();

  /** The installed plugins (reactive) — the sandbox runtime reconciles against this. */
  readonly installed = this.entries.asReadonly();

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.entries.set(parseInstalledList(raw)),
    );
    this.sync.register('settings', STORAGE_KEY, (raw) =>
      this.entries.set(parseInstalledList(raw)),
    );
  }

  /** Records the composition-time plugin ids so an install can never shadow a composed plugin. */
  markComposed(ids: readonly string[]): void {
    this.composedIds = new Set([...this.composedIds, ...ids]);
  }

  isInstalled(id: string): boolean {
    return this.entries().some((entry) => entry.id === id);
  }

  /** The installed entry for an id, or `undefined` — the baseline an update is compared against. */
  find(id: string): InstalledPlugin | undefined {
    return this.entries().find((entry) => entry.id === id);
  }

  /**
   * Installs a catalog entry after the user consented to its declared capabilities. Fail-fast: the
   * `entryUrl` must be same-origin (the store is the distribution's own origin) and the id
   * must be neither composed nor already installed. Persisted; the runtime spawns the plugin live.
   */
  install(plugin: InstalledPlugin): void {
    const entry = this.validEntry(plugin);
    if (this.composedIds.has(plugin.id)) {
      throw new Error(
        `Plugin "${plugin.id}" is already part of this distribution's composition.`,
      );
    }
    if (this.isInstalled(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already installed.`);
    }
    this.persist([...this.entries(), entry]);
  }

  /**
   * Replaces an installed entry with a newer catalog entry (the update flow).
   * Same fail-fast validation as {@link install}, except the id must already be installed. The
   * persisted entry carries the plugin's capabilities, so a declaration that grew must be consented
   * to before this is called — see `confirmUpdate`. The runtime respawns the plugin live.
   */
  update(plugin: InstalledPlugin): void {
    const entry = this.validEntry(plugin);
    if (!this.isInstalled(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is not installed.`);
    }
    this.persist(
      this.entries().map((current) =>
        current.id === entry.id ? entry : current,
      ),
    );
  }

  /** Removes an installed plugin (idempotent); the runtime unloads it live. */
  /**
   * Removes an installed plugin and **deletes its own store** — deliberately the
   * opposite of its settings section, which survives so a reinstall finds its configuration. An
   * abandoned draft of a plugin the user just removed is litter; a preference is not.
   */
  uninstall(id: string): void {
    if (!this.isInstalled(id)) {
      return;
    }
    this.persist(this.entries().filter((entry) => entry.id !== id));
    this.pluginState.removePlugin(id);
  }

  private validEntry(plugin: InstalledPlugin): InstalledPlugin {
    if (!isSameOriginUrl(plugin.entryUrl)) {
      throw new Error(
        `Plugin "${plugin.id}": the entryUrl must be same-origin, got "${plugin.entryUrl}".`,
      );
    }
    const entry = parseInstalledPlugin(plugin);
    if (!entry) {
      throw new Error(`Plugin "${plugin.id}" is not a valid catalog entry.`);
    }
    return entry;
  }

  private persist(next: readonly InstalledPlugin[]): void {
    this.entries.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify(next));
  }
}
