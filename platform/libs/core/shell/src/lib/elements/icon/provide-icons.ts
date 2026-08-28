import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { setDistributionIcon } from './icon-registry-global';
import { LoomIconName } from './loom-icons';

/**
 * Distribution-level icons: seed `name → SVG` into the module-global registry at bootstrap,
 * resolved by `<lw-icon>`. **The distribution wins:** naming one of the first-party icons replaces it
 * everywhere the chrome draws it, which is how a product re-skins the workbench; naming a new one adds it.
 * A *weaver* instead contributes at runtime via `ctx.contributeIcons` and can never shadow a name that is
 * already taken, so an installed plugin cannot repaint the chrome. Distribution icons are build-time and
 * trusted like the first-party set, so they are not re-sanitized.
 *
 * The key type suggests the shipped names while still accepting your own, so a typo in an intended
 * replacement shows up while writing it instead of silently adding a glyph nothing draws.
 *
 * These icons also travel into sandboxed surfaces, so a plugin drawing `<lw-icon name="trash">` shows
 * your glyph rather than ours.
 */
export function provideIcons(
  icons: Readonly<Partial<Record<LoomIconName | (string & {}), string>>>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      for (const [name, svg] of Object.entries(icons)) {
        if (svg !== undefined) {
          setDistributionIcon(name, svg);
        }
      }
    }),
  ]);
}
