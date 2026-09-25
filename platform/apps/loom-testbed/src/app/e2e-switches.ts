import { ShellFeaturesInput } from '@loomweaver/shell';
import { testbedFeatures } from './testbed-features';

const FEATURES_KEY = 'lw.testbed.features';
const INITIAL_WORKSPACE_KEY = 'lw.testbed.initial-workspace';
const CLAIMED_ENTRIES_KEY = 'lw.testbed.claimed-entries';

export const e2eSwitches = {
  features: (): ShellFeaturesInput =>
    testbedFeatures(localStorage.getItem(FEATURES_KEY)),
  initialWorkspace: (): string | null =>
    localStorage.getItem(INITIAL_WORKSPACE_KEY),
  claimedEntries: (): string | null => localStorage.getItem(CLAIMED_ENTRIES_KEY),
};
