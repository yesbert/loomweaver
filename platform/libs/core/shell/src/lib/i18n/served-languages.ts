import { InjectionToken } from '@angular/core';

export const SHIPPED_LANGUAGES: readonly string[] = ['en', 'de'];

export const SERVED_LANGUAGES = new InjectionToken<readonly string[]>(
  'SERVED_LANGUAGES',
  { providedIn: 'root', factory: () => SHIPPED_LANGUAGES },
);

export const LANGUAGE_STORAGE_KEY = 'lw.shell.lang';

const LAST_RESORT = 'en';

function canonicalOrNull(code: string): string | null {
  try {
    return Intl.getCanonicalLocales(code)[0] ?? null;
  } catch {
    return null;
  }
}

export function resolveServedLanguages(
  declared: readonly string[] | undefined,
): readonly string[] {
  if (declared === undefined) {
    return SHIPPED_LANGUAGES;
  }
  if (declared.length === 0) {
    throw new Error(
      'provideShell({ languages }) needs at least one language; omit it to serve the shipped ones.',
    );
  }
  const canonical = declared.map((code) => {
    const resolved = canonicalOrNull(code);
    if (resolved === null) {
      throw new Error(`provideShell({ languages }): "${code}" is not a language code.`);
    }
    return resolved;
  });
  return [...new Set(canonical)];
}

export function servedLanguage(
  value: string | null | undefined,
  served: readonly string[],
): string | undefined {
  if (value == null) {
    return undefined;
  }
  const canonical = canonicalOrNull(value);
  return canonical !== null && served.includes(canonical) ? canonical : undefined;
}

export function languageName(code: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    if (!name || name === code) {
      return code;
    }
    return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  } catch {
    return code;
  }
}

function storedLanguage(): string | null {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function matchPreference(
  preference: string,
  served: readonly string[],
): string | undefined {
  const exact = servedLanguage(preference, served);
  if (exact !== undefined) {
    return exact;
  }
  const canonical = canonicalOrNull(preference);
  const base = canonical?.split('-', 1)[0];
  return base !== undefined && base !== canonical
    ? servedLanguage(base, served)
    : undefined;
}

export function detectInitialLang(served: readonly string[]): string {
  const stored = servedLanguage(storedLanguage(), served);
  if (stored !== undefined) {
    return stored;
  }
  for (const preference of navigator.languages ?? [navigator.language]) {
    const match = matchPreference(preference, served);
    if (match !== undefined) {
      return match;
    }
  }
  return served.includes(LAST_RESORT) ? LAST_RESORT : (served[0] ?? LAST_RESORT);
}
