import { computed, signal } from '@angular/core';
import { ANONYMOUS, type AuthSnapshot } from '@loomweaver/plugin-sdk';
import { LocalStorageStore } from '@loomweaver/shell';

const ACCOUNTS: readonly AuthSnapshot[] = [
  {
    authenticated: true,
    roles: ['accounting'],
    claims: {},
    subject: 'gambit',
    displayName: 'Gambit the Cat',
  },
  {
    authenticated: true,
    roles: ['sales'],
    claims: {},
    subject: 'j.weiler',
    displayName: 'Jonas Weiler',
  },
];

export const ACCOUNT_PICTURES: Readonly<Record<string, string>> = {
  gambit: 'avatar-gambit.jpg',
};

const SIGNED_OUT_KEY = 'demo.session.signed-out';
const ACCOUNT_KEY = 'demo.session.account';

const store = new LocalStorageStore();

function readSignedOut(): boolean {
  return store.peek(SIGNED_OUT_KEY) === 'true';
}

function readAccount(): number {
  const stored = Number(store.peek(ACCOUNT_KEY));
  return Number.isInteger(stored) && stored >= 0 && stored < ACCOUNTS.length ? stored : 0;
}

const signedOut = signal(readSignedOut());
const account = signal(readAccount());

export const demoSession = {
  snapshot: computed<AuthSnapshot>(() =>
    signedOut() ? ANONYMOUS : ACCOUNTS[account()],
  ),
  account: computed<AuthSnapshot>(() => ACCOUNTS[account()]),
  signIn(): void {
    void store.set(SIGNED_OUT_KEY, 'false');
    signedOut.set(false);
  },
  signOut(): void {
    void store.set(SIGNED_OUT_KEY, 'true');
    signedOut.set(true);
  },
  switchAccount(): void {
    const next = (account() + 1) % ACCOUNTS.length;
    void store.set(ACCOUNT_KEY, String(next));
    account.set(next);
  },
};
