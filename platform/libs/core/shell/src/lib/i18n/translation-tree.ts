import { Translation } from '@jsverse/transloco';

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

export function leafKeys(translation: Translation, prefix = ''): string[] {
  return Object.entries(translation).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return isGroup(value) ? leafKeys(value, path) : [path];
  });
}

export function hasKey(translation: Translation, path: string): boolean {
  let node: unknown = translation;
  for (const segment of path.split('.')) {
    if (!isGroup(node) || !Object.hasOwn(node, segment)) {
      return false;
    }
    node = node[segment];
  }
  return true;
}
