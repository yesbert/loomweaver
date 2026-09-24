import { InjectionToken, Provider, inject, isDevMode } from '@angular/core';
import { Capability } from '@loomweaver/plugin-sdk';

/** Capabilities granted per plugin id. A missing id means "no grant" → default-deny. */
export type CapabilityGrants = Readonly<Record<string, readonly Capability[]>>;

const CAPABILITY_GRANT_DECLARATIONS = new InjectionToken<readonly CapabilityGrants[]>(
  'CAPABILITY_GRANT_DECLARATIONS',
);

/**
 * The active capability grants, composed from every {@link provideCapabilityGrants} declaration
 * in the injector. Defaults to **empty** (default-deny — no plugin can do anything until granted).
 * A product can later feed per-tenant grants from its own backend behind the same seam by
 * providing this token itself.
 */
export const CAPABILITY_GRANTS = new InjectionToken<CapabilityGrants>(
  'CAPABILITY_GRANTS',
  {
    providedIn: 'root',
    factory: () =>
      composeGrants(inject(CAPABILITY_GRANT_DECLARATIONS, { optional: true }) ?? []),
  },
);

/**
 * A distribution declares which plugin gets which capabilities. The composition root is the
 * authoritative grant source — the honest default-deny model, dogfooded by the first-party plugin
 * like a third-party one would be. A product backend can replace it behind the same seam.
 *
 * Several calls add up: each declaration contributes what it lists, and a plugin named in more
 * than one holds the union. That is what lets a generator append one call per plugin it composes
 * in, and a single call naming every plugin means exactly what it always meant.
 */
export function provideCapabilityGrants(grants: CapabilityGrants): Provider {
  return { provide: CAPABILITY_GRANT_DECLARATIONS, useValue: grants, multi: true };
}

function composeGrants(declarations: readonly CapabilityGrants[]): CapabilityGrants {
  const composed = new Map<string, Set<Capability>>();
  for (const declaration of declarations) {
    for (const [pluginId, capabilities] of Object.entries(declaration)) {
      const set = composed.get(pluginId) ?? new Set<Capability>();
      for (const capability of capabilities) {
        set.add(capability);
      }
      composed.set(pluginId, set);
    }
  }
  return Object.fromEntries([...composed].map(([pluginId, set]) => [pluginId, [...set]]));
}

/**
 * The effective capability set for one plugin: what the distribution granted, **intersected** with
 * what the plugin declares ("plugin declares, distribution grants"). A grant for an
 * undeclared capability is inert, so least privilege holds in both directions; dev mode flags the
 * mismatch so the composition stays honest. A plugin without a declaration keeps its grants as-is
 * (declaring is optional today; the manifest schema hardens this later).
 */
export function effectiveCapabilities(
  pluginId: string,
  granted: readonly Capability[] | undefined,
  declared: readonly Capability[] | undefined,
): ReadonlySet<Capability> {
  const grants = granted ?? [];
  if (declared === undefined) {
    return new Set(grants);
  }
  const declaredSet = new Set(declared);
  const undeclared = grants.filter(
    (capability) => !declaredSet.has(capability),
  );
  if (undeclared.length > 0 && isDevMode()) {
    console.warn(
      `Plugin "${pluginId}" was granted capabilities it does not declare: ` +
        `${undeclared.join(', ')} — ignored (effective = grant ∩ declaration).`,
    );
  }
  return new Set(grants.filter((capability) => declaredSet.has(capability)));
}
