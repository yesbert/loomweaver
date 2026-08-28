import { computed, signal } from '@angular/core';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { writeLocalStorageBestEffort } from './testbed-storage';

const ANON = 0;
const USER = 1;
const ADMIN = 2;
const GRACE = 3;

const PRINCIPALS: readonly AuthSnapshot[] = [
  ANONYMOUS,
  {
    authenticated: true,
    roles: ['user'],
    claims: {},
    subject: 'ada',
    displayName: 'Ada Lovelace',
  },
  {
    authenticated: true,
    roles: ['user', 'admin'],
    claims: {},
    subject: 'ada',
    displayName: 'Ada Lovelace (admin)',
  },
  {
    authenticated: true,
    roles: ['user'],
    claims: {},
    subject: 'grace',
    displayName: 'Grace Hopper',
  },
];

const STORAGE_KEY = 'testbed.auth.principal';

function restoredIndex(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw === null ? ANON : Number(raw);
    return Number.isInteger(parsed) && parsed >= 0 && parsed < PRINCIPALS.length
      ? parsed
      : ANON;
  } catch {
    return ANON;
  }
}

const index = signal(restoredIndex());

let announce: ((key: string) => void) | undefined;

function switchTo(next: number): AuthSnapshot {
  writeLocalStorageBestEffort(STORAGE_KEY, String(next));
  index.set(next);
  announce?.(STORAGE_KEY);
  return PRINCIPALS[next];
}

export const testbedAuth = {
  connectSync(hooks: { announce(key: string): void }): {
    key: string;
    refresh(): void;
  } {
    announce = hooks.announce;
    return { key: STORAGE_KEY, refresh: () => index.set(restoredIndex()) };
  },
  snapshot: computed(() => PRINCIPALS[index()]),
  cycle(): AuthSnapshot {
    const next = index() >= ADMIN ? ANON : index() + 1;
    return switchTo(next);
  },
  signInAsAdmin(): void {
    switchTo(ADMIN);
  },
  switchToGrace(): void {
    switchTo(GRACE);
  },
  signOut(): void {
    switchTo(ANON);
  },
  dropAdmin(): void {
    if (index() === ADMIN) switchTo(USER);
  },
};
