import { HttpClient } from '@angular/common/http';
import { inject, InjectionToken, isDevMode, Provider, Service } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { catchError, forkJoin, map, of } from 'rxjs';

/**
 * Extra translation namespaces a distribution composes on top of the host base. Each is served at `/i18n/<name>/<lang>.json` and nested under its key, so its strings
 * live at `name.*` and can never collide with a host key. Used for a weaver's own strings
 * (`demo`) and for distribution branding (`product`).
 */
export const TRANSLATION_NAMESPACES = new InjectionToken<readonly string[]>(
  'TRANSLATION_NAMESPACES',
);

/**
 * A distribution declares which namespaced translation bundles to load — the weavers it bundles
 * (e.g. `'testbed'`) and its own branding (`'product'`). The bare platform registers none;
 * its host keys are the whole story.
 */
export function provideTranslationNamespaces(
  ...namespaces: string[]
): Provider {
  return { provide: TRANSLATION_NAMESPACES, useValue: namespaces };
}

/** Directory the distribution serves its overlay bundles from, without a trailing slash. */
export const TRANSLATION_OVERRIDES = new InjectionToken<string>(
  'TRANSLATION_OVERRIDES',
);

export const DEFAULT_OVERRIDES_PATH = '/i18n/overrides';

/**
 * Load `<basePath>/<lang>.json` and merge it over everything else **key by key**, so a product
 * can reword the shell in its own house language ("Save as" rather than "Save as new") without
 * forking our bundle: name only the keys you change and inherit the rest, including every key a
 * later release adds. It is applied last, so it also reaches a bundled weaver's strings.
 *
 * Namespaces (`provideTranslationNamespaces`) remain the way to *add* your own strings, and they can
 * still never collide with a host key. This is the opposite job — replacing one — which is why it is
 * a separate, deliberate opt-in rather than a namespace with a magic name.
 *
 * `basePath` lets one build carry several wordings and pick one while composing — a white-label
 * distribution that serves three brands from the same bundle, or a demo that switches product.
 * A product with a backend does not need it: the default path is same-origin, so its server can
 * already vary the bytes per tenant. Omit it and nothing changes.
 *
 * A language with no overlay file keeps the shipped strings (dev-warned). A key the overlay names but
 * nothing ships is dev-warned too, since a typo there would otherwise be a string that never appears.
 */
export function provideTranslationOverrides(
  basePath: string = DEFAULT_OVERRIDES_PATH,
): Provider {
  const normalized = basePath.replace(/\/+$/, '');
  if (normalized === '') {
    throw new Error(
      'provideTranslationOverrides() needs a directory to load overlays from; ' +
        `pass one or omit the argument for "${DEFAULT_OVERRIDES_PATH}".`,
    );
  }
  return { provide: TRANSLATION_OVERRIDES, useValue: normalized };
}

const MISSING_OVERLAY: Translation = {};

function isGroup(value: unknown): value is Translation {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeTranslation(
  base: Translation,
  overlay: Translation,
): Translation {
  const merged: Translation = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const existing = merged[key];
    merged[key] =
      isGroup(existing) && isGroup(value)
        ? mergeTranslation(existing, value)
        : value;
  }
  return merged;
}

export function unknownOverrideKeys(
  base: Translation,
  overlay: Translation,
  prefix = '',
): string[] {
  const unknown: string[] = [];
  for (const [key, value] of Object.entries(overlay)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const existing = base[key];
    if (existing === undefined) {
      unknown.push(path);
    } else if (isGroup(existing) && isGroup(value)) {
      unknown.push(...unknownOverrideKeys(existing, value, path));
    }
  }
  return unknown;
}

@Service()
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  private readonly namespaces =
    inject(TRANSLATION_NAMESPACES, { optional: true }) ?? [];
  private readonly overrides =
    inject(TRANSLATION_OVERRIDES, { optional: true }) ?? null;

  getTranslation(lang: string): ReturnType<TranslocoLoader['getTranslation']> {
    const host$ = this.http.get<Translation>(`/i18n/${lang}.json`);
    if (this.namespaces.length === 0 && !this.overrides) {
      return host$;
    }

    const namespaced$ = this.namespaces.map((name) =>
      this.http.get<Translation>(`/i18n/${name}/${lang}.json`).pipe(
        catchError((error: unknown) => {
          console.warn(
            `Translation namespace "${name}" failed to load for "${lang}".`,
            error,
          );
          return of<Translation>({});
        }),
      ),
    );
    return forkJoin([host$, ...namespaced$, this.overrides$(lang)]).pipe(
      map(([host, ...rest]) => {
        const overlay = rest.pop() as Translation;
        const merged: Translation = { ...host };
        this.namespaces.forEach((name, index) => (merged[name] = rest[index]));
        return this.applyOverrides(merged, overlay, lang);
      }),
    );
  }

  private overrides$(lang: string) {
    if (!this.overrides) {
      return of<Translation>({});
    }
    return this.http
      .get<Translation>(`${this.overrides}/${lang}.json`)
      .pipe(catchError(() => of<Translation>(MISSING_OVERLAY)));
  }

  private applyOverrides(
    merged: Translation,
    overlay: Translation,
    lang: string,
  ): Translation {
    if (overlay === MISSING_OVERLAY) {
      this.warn(
        `No translation overrides for "${lang}" — its shipped strings are used unchanged.`,
      );
      return merged;
    }
    const unknown = unknownOverrideKeys(merged, overlay);
    if (unknown.length > 0) {
      this.warn(
        `Translation overrides for "${lang}" name ${unknown.length} key(s) nothing ships, ` +
          `so they will never appear: ${unknown.join(', ')}.`,
      );
    }
    return mergeTranslation(merged, overlay);
  }

  private warn(message: string): void {
    if (isDevMode()) {
      console.warn(message);
    }
  }
}
