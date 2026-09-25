import { inject, InjectionToken, Provider } from '@angular/core';

const TRANSLATION_NAMESPACE_DECLARATIONS = new InjectionToken<
  readonly (readonly string[])[]
>('TRANSLATION_NAMESPACE_DECLARATIONS');

/**
 * Extra translation namespaces a distribution composes on top of the host base, in the order they
 * were first declared. Each is served at `/i18n/<name>/<lang>.json` and nested under its key, so
 * its strings live at `name.*` and can never collide with a host key. Used for a plugin's own
 * strings (`demo`) and for distribution branding (`product`).
 *
 * Read it; declare through {@link provideTranslationNamespaces}. Providing this token directly
 * replaces every declaration made that way.
 */
export const TRANSLATION_NAMESPACES = new InjectionToken<readonly string[]>(
  'TRANSLATION_NAMESPACES',
  {
    providedIn: 'root',
    factory: () =>
      distinct(
        (
          inject(TRANSLATION_NAMESPACE_DECLARATIONS, { optional: true }) ?? []
        ).flat(),
      ),
  },
);

/**
 * A distribution declares which namespaced translation bundles to load — the plugins it bundles
 * (e.g. `'reports'`) and its own branding (`'product'`). The bare platform registers none;
 * its host keys are the whole story.
 *
 * Calls accumulate: a second call further down the composition root adds its names to the first
 * rather than replacing it, and a name declared twice is loaded once.
 */
export function provideTranslationNamespaces(
  ...namespaces: string[]
): Provider {
  return {
    provide: TRANSLATION_NAMESPACE_DECLARATIONS,
    useValue: namespaces,
    multi: true,
  };
}

function distinct(names: readonly string[]): readonly string[] {
  return [...new Set(names)];
}
