import { computed, Signal, signal } from '@angular/core';
import { ANONYMOUS, AuthSnapshot } from '@loomweaver/plugin-sdk';
import { ShellFeaturesInput } from '@loomweaver/shell';
import { testbedFeatures } from './testbed-features';

const FEATURES_KEY = 'lw.testbed.features';
const INITIAL_WORKSPACE_KEY = 'lw.testbed.initial-workspace';
const CLAIMED_ENTRIES_KEY = 'lw.testbed.claimed-entries';
const SESSION_DELAY_KEY = 'lw.testbed.session-delay';
const SESSION_AWAITED_KEY = 'lw.testbed.session-awaited';
const GATED_WORKSPACE_KEY = 'lw.testbed.gated-workspace';

interface TestbedSession {
  readonly snapshot: Signal<AuthSnapshot>;
  readonly identity: () => string | null;
  readonly arrival: Promise<void>;
  readonly awaited: boolean;
}

function session(chosen: Signal<AuthSnapshot>): TestbedSession {
  const delay = Number(localStorage.getItem(SESSION_DELAY_KEY));
  if (!(delay > 0)) {
    return {
      snapshot: chosen,
      identity: () => chosen().subject ?? null,
      arrival: Promise.resolve(),
      awaited: false,
    };
  }
  const arrived = signal(false);
  const snapshot = computed(() => (arrived() ? chosen() : ANONYMOUS));
  return {
    snapshot,
    identity: () => snapshot().subject ?? null,
    arrival: new Promise((resolve) =>
      setTimeout(() => {
        arrived.set(true);
        resolve();
      }, delay),
    ),
    awaited: localStorage.getItem(SESSION_AWAITED_KEY) === 'true',
  };
}

export const e2eSwitches = {
  features: (): ShellFeaturesInput =>
    testbedFeatures(localStorage.getItem(FEATURES_KEY)),
  initialWorkspace: (): string | null =>
    localStorage.getItem(INITIAL_WORKSPACE_KEY),
  claimedEntries: (): string | null => localStorage.getItem(CLAIMED_ENTRIES_KEY),
  session,
  gatedWorkspace: (): boolean =>
    localStorage.getItem(GATED_WORKSPACE_KEY) === 'true',
};
