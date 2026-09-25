import { signal } from '@angular/core';

const KEY_PREFIX = 'sk-or-';
const STORAGE_KEY = 'assistant-workbench.openrouter-key';

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

const current = signal(stored());

export const openRouterKey = {
  value: current.asReadonly(),

  use(raw: string): boolean {
    const key = cleanKey(raw);
    if (!looksLikeKey(key)) {
      return false;
    }
    store(key);
    current.set(key);
    return true;
  },

  forget(): void {
    store(null);
    current.set('');
  },
};

function stored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function store(key: string | null): void {
  try {
    if (key === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, key);
    }
  } catch {
    return;
  }
}
