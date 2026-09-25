import { computed, signal } from '@angular/core';
import { ANONYMOUS, type AuthSnapshot } from '@loomweaver/plugin-sdk';
import { readStored, storeBestEffort } from '../best-effort-storage';

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

function readSignedOut(): boolean {
  return readStored(SIGNED_OUT_KEY) === 'true';
}

function readAccount(): number {
  const stored = Number(readStored(ACCOUNT_KEY));
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
    storeBestEffort(SIGNED_OUT_KEY, 'false');
    signedOut.set(false);
  },
  signOut(): void {
    storeBestEffort(SIGNED_OUT_KEY, 'true');
    signedOut.set(true);
  },
  switchAccount(): void {
    const next = (account() + 1) % ACCOUNTS.length;
    storeBestEffort(ACCOUNT_KEY, String(next));
    account.set(next);
  },
};
