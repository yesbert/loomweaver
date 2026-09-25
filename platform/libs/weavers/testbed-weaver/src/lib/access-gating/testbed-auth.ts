import { computed, signal } from '@angular/core';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { CrossTabHooks, CrossTabLink, persistedChoice } from '../persisted-choice';

type PrincipalName = 'anonymous' | 'ada' | 'adaAdmin' | 'grace';

const PRINCIPALS: Readonly<Record<PrincipalName, AuthSnapshot>> = {
  anonymous: ANONYMOUS,
  ada: {
    authenticated: true,
    roles: ['user'],
    claims: {},
    subject: 'ada',
    displayName: 'Ada Lovelace',
  },
  adaAdmin: {
    authenticated: true,
    roles: ['user', 'admin'],
    claims: {},
    subject: 'ada',
    displayName: 'Ada Lovelace (admin)',
  },
  grace: {
    authenticated: true,
    roles: ['user'],
    claims: {},
    subject: 'grace',
    displayName: 'Grace Hopper',
  },
};

const CYCLE: readonly PrincipalName[] = ['anonymous', 'ada', 'adaAdmin'];

const choice = persistedChoice('testbed.auth.principal');

function restored(): PrincipalName {
  const stored = choice.read();
  return stored !== null && Object.hasOwn(PRINCIPALS, stored)
    ? (stored as PrincipalName)
    : 'anonymous';
}

const current = signal<PrincipalName>(restored());

function switchTo(next: PrincipalName): void {
  choice.write(next);
  current.set(next);
}

function nextInCycle(name: PrincipalName): PrincipalName {
  return CYCLE.at(CYCLE.indexOf(name) + 1) ?? 'anonymous';
}

export const testbedAuth = {
  connectSync: (hooks: CrossTabHooks): CrossTabLink =>
    choice.connectSync(hooks, () => current.set(restored())),
  snapshot: computed(() => PRINCIPALS[current()]),
  cycle(): void {
    switchTo(nextInCycle(current()));
  },
  signInAsAdmin(): void {
    switchTo('adaAdmin');
  },
  switchToGrace(): void {
    switchTo('grace');
  },
  signOut(): void {
    switchTo('anonymous');
  },
  dropAdmin(): void {
    if (current() === 'adaAdmin') {
      switchTo('ada');
    }
  },
};
