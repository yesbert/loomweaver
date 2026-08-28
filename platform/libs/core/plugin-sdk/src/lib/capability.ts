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
 * nothing it was not granted. Granularity is intentionally coarse first; a scope
 * can split into finer ones later without changing the model. Each names a slice of the `ctx`:
 *
 * - `contributions` — register contributions (`ctx.registerSurface/Command/BarItem/RailItem/
 *                     SettingsSection/MenuItem`, `ctx.contributeIcons`).
 * - `ui`           — use the host UI services (`ctx.ui.*`: dialogs, toasts, settings, context menus).
 * - `host`         — read host facts (`ctx.host`: version, update state).
 * - `navigation`   — drive and read the content area (`ctx.navigateContent/openContentTab/
 *                     closeContentTab/keepContentTab/pinContentTab/unpinContentTab/revealSurface`
 *                     and the read-side `ctx.activeContent`).
 * - `session`      — read session facts (`ctx.session`: login state + roles) for self-gating.
 * - `theme`        — contribute design tokens that re-color the whole app (`ctx.contributeTheme`).
 * - `automation`   — run actions other plugins contributed (`ctx.invokeCommand`,
 *                     `ctx.invocableCommands`). A plugin reaches its own commands without it.
 */
export type Capability = (typeof CAPABILITIES)[number];

/**
 * Thrown when a plugin uses a `ctx` surface it was not granted (default-deny). A curated-v1
 * misconfiguration (the distribution forgot to grant a capability the plugin needs) surfaces
 * loudly here rather than as a silent no-op — part of the `ctx`-boundary error taxonomy.
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
