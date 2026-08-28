import { TESTBED_IDENTITY } from './testbed-identity';

describe('TESTBED_IDENTITY', () => {
  it('brands the distribution as the LoomWeaver testbed', () => {
    expect(TESTBED_IDENTITY.name).toBe('LoomWeaver Testbed');
    expect(TESTBED_IDENTITY.logoUrl).toBe('loomweaver-icon.png');
  });
});
