/**
 * Every coarse capability, in canonical display order. The single source of truth — {@link Capability}
 * is derived from it so the type and the list can never drift, and a host surface (e.g. the built-in
 * permissions settings) can iterate them.
 */
export const CAPABILITIES = [
  'contributions',
  'ui',
  'host',
  'navigation',
  'session',
  'theme',
  'automation',
] as const;

/**
 * Coarse capabilities a plugin can hold — capability injection, **default-deny**: a plugin gets
 * nothing it was not granted. Each names an area of `ctx`, and every `ctx` member says in its own
 * documentation which one it needs:
 *
 * - `contributions` — register contributions, and change the ones you registered.
 * - `ui`           — use the host UI services under `ctx.ui`.
 * - `host`         — read host facts under `ctx.host`.
 * - `navigation`   — drive the content area, and read what it shows.
 * - `session`      — read session facts under `ctx.session`.
 * - `theme`        — contribute design tokens that re-color the whole app.
 * - `automation`   — run commands other plugins contributed. A plugin reaches its own without it.
 */
export type Capability = (typeof CAPABILITIES)[number];

/**
 * Thrown when a plugin uses a `ctx` member it was not granted (default-deny). A distribution that
 * forgot to grant a capability the plugin needs finds out here, loudly, instead of through a call
 * that silently does nothing.
 */
export class CapabilityError extends Error {
  constructor(
    readonly capability: Capability,
    readonly pluginId: string,
    /** Why this particular call needed the capability, when that is not obvious from the member alone. */
    readonly reason?: string,
  ) {
    super(
      `Plugin "${pluginId}" is missing the "${capability}" capability (default-deny).` +
        (reason ? ` ${reason}` : ''),
    );
    this.name = 'CapabilityError';
  }
}
