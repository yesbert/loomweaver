import { computed, inject, Service, signal } from '@angular/core';
import { CAPABILITIES, Capability } from '@loomweaver/plugin-sdk';
import { SETTINGS_STORE } from '../persistence/settings-store';
import { hydrateAsync } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';
import { CAPABILITY_GRANTS, effectiveCapabilities } from './capability-grants';
import { parseIdSet, toggledIdSet } from '../persistence/persisted-id-set';

const STORAGE_KEY = 'lw.shell.capability-revocations';

const REVOCABLE: readonly Capability[] = CAPABILITIES.filter(
  (capability) => capability !== 'contributions',
);

/** One capability as shown in the permissions surface: whether the user currently keeps it on. */
export interface PluginCapabilityState {
  readonly capability: Capability;
  readonly effective: boolean;
}

/** A plugin and the base-granted capabilities the user can manage for it. */
export interface PluginPermissions {
  readonly pluginId: string;
  readonly capabilities: readonly PluginCapabilityState[];
}

function revocationKey(pluginId: string, capability: Capability): string {
  return `${pluginId}:${capability}`;
}

function parseRevocations(raw: string | undefined): ReadonlySet<string> {
  return new Set(
    [...parseIdSet(raw)].filter((key) =>
      REVOCABLE.some((capability) => key.endsWith(`:${capability}`)),
    ),
  );
}

/**
 * The live capability broker. The distribution's static grants (the platform ships no server, so
 * the composition root — later a per-tenant backend behind the same seam —
 * is the grant source) form each plugin's **base** set (grant ∩ declaration). On top of that the user can
 * **revoke** a granted capability at runtime; the decision is user-local and persisted through the
 * {@link SETTINGS_STORE}, exactly like the rest of the chrome state. Enforcement in
 * {@link HostPluginContext} consults {@link isGranted} on every `ctx` call, so a revocation takes effect
 * on the plugin's next call without a reload — the honest default-deny model made transparent and
 * user-controllable (a "Permissions" settings surface), never wider than the distribution allowed.
 */
@Service()
export class CapabilityGrantService {
  private readonly store = inject(SETTINGS_STORE);

  private readonly sync = inject(StateSyncService);

  private readonly grants = inject(CAPABILITY_GRANTS);

  private readonly revoked = signal<ReadonlySet<string>>(
    parseRevocations(this.store.peek?.(STORAGE_KEY)),
  );

  private readonly bases = signal<ReadonlyMap<string, ReadonlySet<Capability>>>(
    new Map(),
  );

  /** The plugins and their base-granted capabilities, for the permissions settings surface. */
  readonly permissions = computed<readonly PluginPermissions[]>(() => {
    const bases = this.bases();
    const revoked = this.revoked();
    return [...bases.entries()]
      .map(([pluginId, base]) => ({
        pluginId,
        capabilities: REVOCABLE.filter((capability) =>
          base.has(capability),
        ).map((capability) => ({
          capability,
          effective: !revoked.has(revocationKey(pluginId, capability)),
        })),
      }))
      .filter((entry) => entry.capabilities.length > 0)
      .toSorted((a, b) => a.pluginId.localeCompare(b.pluginId));
  });

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.revoked.set(parseRevocations(raw)),
    );
    this.sync.register('settings', STORAGE_KEY, (raw) =>
      this.revoked.set(parseRevocations(raw)),
    );
  }

  /**
   * Records a plugin's base grant (grant ∩ declaration) so enforcement and the permissions surface know
   * about it. A runtime calls this once when it activates a plugin. `granted` overrides the
   * distribution's static grant source — used for user-installed plugins, whose grant is the user's
   * install consent instead of the composition root.
   */
  register(
    pluginId: string,
    declared: readonly Capability[] | undefined,
    granted?: readonly Capability[],
  ): void {
    const base = effectiveCapabilities(
      pluginId,
      granted ?? this.grants[pluginId],
      declared,
    );
    this.bases.update((map) => new Map(map).set(pluginId, base));
  }

  /** Drops a plugin from the permissions surface (its runtime deactivated it). Idempotent. */
  unregister(pluginId: string): void {
    this.bases.update((map) => {
      if (!map.has(pluginId)) {
        return map;
      }
      const next = new Map(map);
      next.delete(pluginId);
      return next;
    });
  }

  /** Whether `pluginId` may use `capability` right now: base-granted and not user-revoked. */
  isGranted(pluginId: string, capability: Capability): boolean {
    return (
      this.isBaseGranted(pluginId, capability) &&
      !this.revoked().has(revocationKey(pluginId, capability))
    );
  }

  /**
   * Whether the distribution granted `capability` to `pluginId` (grant ∩ declaration), **ignoring** any
   * user revocation. Used only while a plugin activates — a revocation must not stop it from loading and
   * registering its contributions; it applies to the plugin's runtime `ctx` calls afterwards.
   */
  isBaseGranted(pluginId: string, capability: Capability): boolean {
    return Boolean(this.bases().get(pluginId)?.has(capability));
  }

  /** Turns a base-granted capability on or off for a plugin (user revoke / restore). Persisted. */
  setGranted(pluginId: string, capability: Capability, granted: boolean): void {
    const next = toggledIdSet(
      this.revoked(),
      revocationKey(pluginId, capability),
      !granted,
    );
    this.revoked.set(next);
    void this.store.set(STORAGE_KEY, JSON.stringify([...next]));
  }
}
