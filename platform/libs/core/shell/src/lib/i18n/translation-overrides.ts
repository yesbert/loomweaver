import { InjectionToken, Provider } from '@angular/core';
import { ServedBase } from '../foundation/served-base';

/**
 * Directory the distribution serves its overlay bundles from, without a trailing slash: relative to
 * the application's base, or from the origin's root when it starts with `/` or names a scheme.
 */
export const TRANSLATION_OVERRIDES = new InjectionToken<string>(
  'TRANSLATION_OVERRIDES',
);

export const DEFAULT_OVERRIDES_PATH = 'i18n/overrides';

const FROM_THE_ORIGIN = /^(\/|[a-z][a-z\d+.-]*:)/i;

function withoutTrailingSlashes(path: string): string {
  let end = path.length;
  while (end > 0 && path[end - 1] === '/') {
    end -= 1;
  }
  return path.slice(0, end);
}

/**
 * Load `<basePath>/<lang>.json` and merge it over everything else **key by key**, so a product
 * can reword the shell in its own house language ("Save as" rather than "Save as new") without
 * forking our bundle: name only the keys you change and inherit the rest, including every key a
 * later release adds. It is applied last, so it also reaches a bundled plugin's strings.
 *
 * Namespaces (`provideTranslationNamespaces`) remain the way to *add* your own strings, and they can
 * still never collide with a host key. This is the opposite job — replacing one — which is why it is
 * a separate, deliberate opt-in rather than a namespace with a magic name.
 *
 * `basePath` lets one build carry several wordings and pick one while composing — a white-label
 * distribution that serves three brands from the same bundle, or a demo that switches product.
 * A product with a backend does not need it: the default directory, `i18n/overrides` under the
 * application's base, is same-origin, so its server can already vary the bytes per tenant. Omit it
 * and nothing changes. A relative `basePath` resolves under the application's base as the default
 * does; one that starts with `/` or names a scheme is used as named.
 *
 * A language with no overlay file keeps the shipped strings (dev-warned). A key the overlay names but
 * nothing ships is dev-warned too, since a typo there would otherwise be a string that never appears.
 */
export function provideTranslationOverrides(
  basePath: string = DEFAULT_OVERRIDES_PATH,
): Provider {
  const normalized = withoutTrailingSlashes(basePath);
  if (normalized === '') {
    throw new Error(
      'provideTranslationOverrides() needs a directory to load overlays from; ' +
        `pass one or omit the argument for "${DEFAULT_OVERRIDES_PATH}".`,
    );
  }
  return { provide: TRANSLATION_OVERRIDES, useValue: normalized };
}

export function overlayDirectory(named: string, base: ServedBase): string {
  return FROM_THE_ORIGIN.test(named) ? named : base.under(named);
}
