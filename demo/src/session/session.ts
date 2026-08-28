import { computed, signal } from '@angular/core';
import { ANONYMOUS, type AuthSnapshot } from '@loomweaver/plugin-sdk';

const ACCOUNTS: readonly AuthSnapshot[] = [
  {
    authenticated: true,
    roles: ['accounting'],
    claims: {},
    subject: 'm.behrens',
    displayName: 'Merle Behrens',
  },
  {
    authenticated: true,
    roles: ['sales'],
    claims: {},
    subject: 'j.weiler',
    displayName: 'Jonas Weiler',
  },
];

const SIGNED_OUT_KEY = 'demo.session.signed-out';
const ACCOUNT_KEY = 'demo.session.account';

function readSignedOut(): boolean {
  try {
    return localStorage.getItem(SIGNED_OUT_KEY) === 'true';
  } catch {
    return false;
  }
}

function readAccount(): number {
  try {
    const stored = Number(localStorage.getItem(ACCOUNT_KEY));
    return Number.isInteger(stored) && stored >= 0 && stored < ACCOUNTS.length
      ? stored
      : 0;
  } catch {
    return 0;
  }
}

function rememberBestEffort(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

const signedOut = signal(readSignedOut());
const account = signal(readAccount());

export const demoSession = {
  snapshot: computed<AuthSnapshot>(() =>
    signedOut() ? ANONYMOUS : ACCOUNTS[account()],
  ),
  account: computed<AuthSnapshot>(() => ACCOUNTS[account()]),
  signIn(): void {
    rememberBestEffort(SIGNED_OUT_KEY, 'false');
    signedOut.set(false);
  },
  signOut(): void {
    rememberBestEffort(SIGNED_OUT_KEY, 'true');
    signedOut.set(true);
  },
  switchAccount(): void {
    const next = (account() + 1) % ACCOUNTS.length;
    rememberBestEffort(ACCOUNT_KEY, String(next));
    account.set(next);
  },
};
