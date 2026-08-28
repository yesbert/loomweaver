import { Finding } from './types';

export type I18nBundle = Readonly<Record<string, unknown>>;

function flattenKeys(bundle: I18nBundle, prefix = ''): string[] {
  return Object.entries(bundle).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as I18nBundle, path);
    }
    return [path];
  });
}

export function validateI18nParity(bundles: Readonly<Record<string, I18nBundle>>): Finding[] {
  const languages = Object.keys(bundles);
  if (languages.length < 2) {
    return [];
  }

  const keysByLanguage = new Map(languages.map((lang) => [lang, new Set(flattenKeys(bundles[lang]))]));
  const allKeys = new Set<string>();
  for (const keys of keysByLanguage.values()) {
    for (const key of keys) {
      allKeys.add(key);
    }
  }

  const findings: Finding[] = [];
  for (const lang of languages) {
    const keys = keysByLanguage.get(lang);
    for (const key of allKeys) {
      if (!keys?.has(key)) {
        findings.push({
          level: 'warning',
          code: 'i18n.missingKey',
          message: `Language "${lang}" is missing translation key "${key}".`,
          path: `i18n/${lang}`,
        });
      }
    }
  }
  return findings;
}
