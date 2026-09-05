export const KEY_PREFIX = 'sk-or-';

export function cleanKey(raw: string): string {
  return raw
    .trim()
    .replace(/^authorization\s*:\s*/i, '')
    .replace(/^['"`]+|['"`,;]+$/g, '')
    .replace(/^(bearer\s+)+/i, '')
    .trim();
}

export function looksLikeKey(key: string): boolean {
  return key.startsWith(KEY_PREFIX) && !/\s/.test(key);
}
