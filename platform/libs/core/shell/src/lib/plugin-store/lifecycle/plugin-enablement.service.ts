import { computed, inject, Service, signal } from '@angular/core';
import { SETTINGS_STORE } from '../../persistence/settings-store';
import { hydrateAsync } from '../../persistence/hydrate';
import { StateSyncService } from '../../persistence/state-sync.service';
import { parseIdSet, toggledIdSet } from '../../persistence/persisted-id-set';
import { REQUIRED_PLUGINS } from '../../foundation/required-plugins';
import { PluginInfo } from './plugin-info';

const STORAGE_KEY = 'lw.shell.disabled-plugins';

/**
 * Whether each plugin is turned on — plugin enable/disable, distinct from capability revocation. Disabling a plugin is coarse: it does not restrict a power, it unloads the
 * whole plugin so **none** of its contributions appear; enabling loads it again. The decision is
 * user-local and persisted through the {@link SETTINGS_STORE}, exactly like the rest of the chrome state.
 *
 * This service holds only the state; the runtimes ({@link PluginRuntime}, {@link FramePluginRuntime})
 * inject it and reconcile activation against {@link disabled} reactively, so a toggle takes effect at
 * once without a reload. It never depends on the runtimes, which keeps the dependency one-way.
 */
@Service()
export class PluginEnablementService {
  private readonly store = inject(SETTINGS_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly required = new Set(inject(REQUIRED_PLUGINS));

  private readonly disabledSet = signal<ReadonlySet<string>>(
    parseIdSet(this.store.peek?.(STORAGE_KEY)),
  );

  private readonly names = signal<ReadonlyMap<string, string>>(new Map());

  /**
   * The disabled plugin ids (reactive) — a runtime reconciles activation against this. A plugin the
   * distribution declared its application cannot run without never appears here, whatever is stored,
   * so the runtime and the permissions surface read one answer rather than two.
   */
  readonly disabled = computed<ReadonlySet<string>>(() => {
    const stored = this.disabledSet();
    if (this.required.size === 0) {
      return stored;
    }
    return new Set([...stored].filter((id) => !this.required.has(id)));
  });

  /** Every known plugin with its enabled state, for the permissions settings surface. */
  readonly plugins = computed<readonly PluginInfo[]>(() => {
    const disabled = this.disabled();
    return [...this.names().entries()]
      .map(([id, name]) => ({ id, name, enabled: !disabled.has(id) }))
      .toSorted((a, b) => a.name.localeCompare(b.name));
  });


  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.disabledSet.set(parseIdSet(raw)),
    );
    this.sync.register('settings', STORAGE_KEY, (raw) =>
      this.disabledSet.set(parseIdSet(raw)),
    );
  }

  /** Whether the distribution declared it cannot run without this plugin. */
  isRequired(id: string): boolean {
    return this.required.has(id);
  }

  /** Records a plugin so the permissions surface can list it (enabled or not). Idempotent. A runtime calls it for every plugin it knows. */
  register(id: string, name: string): void {
    this.names.update((map) =>
      map.has(id) ? map : new Map(map).set(id, name),
    );
  }

  /** Drops a plugin from the list — it was uninstalled, not merely disabled. Idempotent. */
  unregister(id: string): void {
    this.names.update((map) => {
      if (!map.has(id)) {
        return map;
      }
      const next = new Map(map);
      next.delete(id);
      return next;
    });
  }

  /** Whether `id` is currently enabled (default: yes — a plugin is on until the user turns it off). */
  isEnabled(id: string): boolean {
    return !this.disabled().has(id);
  }

  /**
   * Turns a whole plugin on or off (persisted). The runtimes react by loading/unloading it. Turning
   * off a plugin the distribution declared it cannot run without does nothing: the surface offers no
   * switch for one, and this is the same answer read from anywhere else.
   */
  setEnabled(id: string, enabled: boolean): void {
    if (!enabled && this.required.has(id)) {
      return;
    }
    const next = toggledIdSet(this.disabledSet(), id, !enabled);
    this.disabledSet.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify([...next]));
  }
}
