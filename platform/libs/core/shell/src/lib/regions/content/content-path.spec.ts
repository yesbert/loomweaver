import { restBelow, suffixOf } from './content-path';

describe('the rest below a prefix', () => {
  it('hands over everything under the tab root', () => {
    expect(restBelow('programs', '/programs/US003950/pricing')).toBe(
      'US003950/pricing',
    );
  });

  it('keeps the query string verbatim', () => {
    expect(restBelow('programs', '/programs/205470?treaty=886320')).toBe(
      '205470?treaty=886320',
    );
    expect(restBelow('programs', '/programs?treaty=886320')).toBe(
      '?treaty=886320',
    );
  });

  it('keeps a fragment too', () => {
    expect(restBelow('programs', '/programs/205470#top')).toBe('205470#top');
  });

  it('is empty on the bare prefix', () => {
    expect(restBelow('programs', '/programs')).toBe('');
  });

  it('does not mistake a longer sibling for a deeper address', () => {
    expect(restBelow('programs', '/programs-archive/205470')).toBe('');
  });

  it('hands the whole path to a surface rooted at the empty path', () => {
    expect(restBelow('', '/anything/deep?x=1')).toBe('anything/deep?x=1');
  });

  it('reads the suffix off a url, or nothing', () => {
    expect(suffixOf('programs/205470?a=1#b')).toBe('?a=1#b');
    expect(suffixOf('programs/205470#b')).toBe('#b');
    expect(suffixOf('programs/205470')).toBe('');
  });
});
