import { signal } from '@angular/core';
import { LocalStorageStore } from '@loomweaver/shell';

const KEY_PREFIX = 'sk-or-';
const STORAGE_KEY = 'assistant-workbench.openrouter-key';
const store = new LocalStorageStore();

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

const current = signal(store.peek(STORAGE_KEY) ?? '');

export const openRouterKey = {
  value: current.asReadonly(),

  use(raw: string): boolean {
    const key = cleanKey(raw);
    if (!looksLikeKey(key)) {
      return false;
    }
    void store.set(STORAGE_KEY, key);
    current.set(key);
    return true;
  },

  forget(): void {
    void store.delete(STORAGE_KEY);
    current.set('');
  },
};
