import { fuzzyScore } from './palette-fuzzy';

describe('fuzzyScore', () => {
  it('matches a subsequence, not only a substring', () => {
    expect(fuzzyScore('rst', 'Reset list')).not.toBeNull();
    expect(fuzzyScore('spl', 'Split editor')).not.toBeNull();
  });

  it('returns null when a query character is missing or out of order', () => {
    expect(fuzzyScore('zzz', 'Reset list')).toBeNull();
    expect(fuzzyScore('tsr', 'rst')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(fuzzyScore('RESET', 'reset list')).not.toBeNull();
  });

  it('ranks a consecutive substring above a scattered subsequence', () => {
    const consecutive = fuzzyScore('set', 'Settings');
    const scattered = fuzzyScore('set', 'Split editor tab');
    expect(consecutive).not.toBeNull();
    expect(scattered).not.toBeNull();
    expect(consecutive as number).toBeGreaterThan(scattered as number);
  });

  it('rewards word-start hits', () => {
    const wordStarts = fuzzyScore('sp', 'Show panel');
    const midWord = fuzzyScore('sp', 'Inspector');
    expect(wordStarts as number).toBeGreaterThan(midWord as number);
  });

  it('an empty query matches everything with a neutral score', () => {
    expect(fuzzyScore('', 'Anything')).toBe(0);
  });
});
