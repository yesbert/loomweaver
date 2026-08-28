import { DEFAULT_LOOK, LOOKS, lookById } from './looks';

describe('looks', () => {
  it('falls back to the default rather than applying an unknown look', () => {
    expect(lookById('does-not-exist')).toBe(DEFAULT_LOOK);
  });

  it('resolves every declared look by its id', () => {
    for (const look of LOOKS) {
      expect(lookById(look.id)).toBe(look);
    }
  });

  it('leaves the default look on the shipped wording', () => {
    expect(DEFAULT_LOOK.overrides).toBeNull();
  });

  it('serves every other look its own overlay directory', () => {
    const dirs = LOOKS.map((look) => look.overrides).filter(
      (dir): dir is string => dir !== null,
    );
    expect(new Set(dirs).size).toBe(dirs.length);
  });
});
