import { computed, inject, Service, signal } from '@angular/core';
import { persistedSetting } from '../../persistence/stored-values/persisted-setting';
import { ID_SET_CODEC, toggledIdSet } from '../../persistence/stored-values/persisted-id-set';
import { REQUIRED_PLUGINS } from '../../foundation/required-plugins';
import { PluginDeploymentService } from '../../plugin-store/lifecycle/plugin-deployment.service';
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
  private readonly required = new Set(inject(REQUIRED_PLUGINS));

  private readonly deployment = inject(PluginDeploymentService);

  private readonly storedDisabled = persistedSetting(STORAGE_KEY, ID_SET_CODEC);

  private readonly names = signal<ReadonlyMap<string, string>>(new Map());

  /**
   * The disabled plugin ids (reactive) — a runtime reconciles activation against this. A plugin the
   * distribution declared its application cannot run without never appears here, and neither does
   * one the operator deploys, whatever is stored, so the runtimes, the store and the permissions
   * surface read one answer rather than several.
   */
  readonly disabled = computed<ReadonlySet<string>>(() => {
    const stored = this.storedDisabled.value();
    const alwaysOn = (id: string) =>
      this.required.has(id) || this.deployment.isDeployed(id);
    return new Set([...stored].filter((id) => !alwaysOn(id)));
  });

  /** Every known plugin with its enabled state, for the permissions settings surface. */
  readonly plugins = computed<readonly PluginInfo[]>(() => {
    const disabled = this.disabled();
    return [...this.names().entries()]
      .map(([id, name]) => ({ id, name, enabled: !disabled.has(id) }))
      .toSorted((a, b) => a.name.localeCompare(b.name));
  });

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
    this.storedDisabled.set(
      toggledIdSet(this.storedDisabled.value(), id, !enabled),
    );
  }
}
