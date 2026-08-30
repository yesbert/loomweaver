import { InjectionToken, Provider } from '@angular/core';

/** Plugin ids a distribution declared its application cannot run without. */
export type RequiredPlugins = readonly string[];

/**
 * The plugins this distribution declared not optional. Defaults to **none** — every plugin is the
 * user's to switch off until a distribution says otherwise.
 */
export const REQUIRED_PLUGINS = new InjectionToken<RequiredPlugins>(
  'REQUIRED_PLUGINS',
  { providedIn: 'root', factory: () => [] },
);

/**
 * A distribution declares which of the plugins it composes its application cannot run without. Such
 * a plugin is listed in the permissions settings with what it holds, and **without a switch to turn
 * it off**; it stays active whatever the user chose before.
 *
 * This is the distribution's statement and not the plugin's, and deliberately so: everything a plugin
 * declares about itself is a request the distribution grants, so a manifest field here would be the
 * one exemption a plugin could award itself.
 *
 * It withholds the plugin's own switch and nothing else. The capabilities such a plugin was granted
 * stay revocable, because needing a plugin says nothing about needing everything it asked for — which
 * is what distinguishes this from a plugin the operator deployed, where both are withheld.
 *
 * Naming a plugin this distribution does not compose — neither one it provides in-process nor an
 * isolated one it declares — is a composition mistake, not a failure: it is reported in development
 * and otherwise ignored, the same way a capability granted to a plugin that never declared it is. The
 * report happens once the composed plugins are registered, which is the only moment that set is
 * settled: a plugin the store installs arrives later and is the user's to switch off in any case.
 *
 * @example
 * provideRequiredPlugins('sign-in')
 */
export function provideRequiredPlugins(...pluginIds: string[]): Provider {
  return { provide: REQUIRED_PLUGINS, useValue: pluginIds };
}
