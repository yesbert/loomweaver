import { CAPABILITIES, type AgentConsent } from '@loomweaver/plugin-sdk';
import { STATED_CONSENTS } from './commands';
import { KNOWN_CAPABILITIES } from './manifest';

const CONTRACT_CONSENTS: Record<AgentConsent, true> = {
  allow: true,
  ask: true,
  'ask-always': true,
  never: true,
};

describe('the validators speak the plugin contract', () => {
  it('know exactly the capabilities the contract declares', () => {
    expect(KNOWN_CAPABILITIES).toEqual(CAPABILITIES);
  });

  it('read exactly the consent values the contract declares', () => {
    expect(STATED_CONSENTS).toEqual(Object.keys(CONTRACT_CONSENTS));
  });
});
