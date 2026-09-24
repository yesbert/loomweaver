import { isKnownToken } from './theme-tokens';

describe('isKnownToken', () => {
  it('knows the canonical tokens and rejects unknown names', () => {
    expect(isKnownToken('--lw-brand')).toBe(true);
    expect(isKnownToken('--lw-font-sans')).toBe(true);
    expect(isKnownToken('--lw-nope')).toBe(false);
  });
});
