import { formatCount, formatUpdated } from './format';

describe('formatCount', () => {
  it('groups digits for the locale', () => {
    expect(formatCount('en-US', 1234567)).toBe('1,234,567');
    expect(formatCount('de-DE', 1234567)).toBe('1.234.567');
  });
});

describe('formatUpdated', () => {
  const iso = (daysAgo: number): string =>
    new Date(Date.now() - daysAgo * 86_400_000).toISOString();

  it('returns the raw string for an unparseable date', () => {
    expect(formatUpdated('en-US', 'not-a-date')).toBe('not-a-date');
  });

  it('formats within the last week in days', () => {
    expect(formatUpdated('en-US', iso(2))).toMatch(/day/);
  });

  it('formats a few weeks back in weeks', () => {
    expect(formatUpdated('en-US', iso(14))).toMatch(/week/);
  });

  it('formats a few months back in months', () => {
    expect(formatUpdated('en-US', iso(90))).toMatch(/month/);
  });

  it('formats over a year back in years', () => {
    expect(formatUpdated('en-US', iso(800))).toMatch(/year/);
  });
});
