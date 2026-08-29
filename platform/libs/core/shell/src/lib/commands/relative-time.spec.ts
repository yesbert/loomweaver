import { formatRelativeTime } from './relative-time';

describe('formatRelativeTime', () => {
  const now = Date.UTC(2026, 0, 15, 12, 0, 0);

  it('scales from seconds up to days', () => {
    expect(formatRelativeTime('en', now - 5000, now)).toBe('5 seconds ago');
    expect(formatRelativeTime('en', now - 5 * 60_000, now)).toBe('5 minutes ago');
    expect(formatRelativeTime('en', now - 5 * 3_600_000, now)).toBe('5 hours ago');
    expect(formatRelativeTime('en', now - 5 * 86_400_000, now)).toBe('5 days ago');
  });

  it('uses the numeric:auto wording for the nearest units', () => {
    expect(formatRelativeTime('en', now, now)).toBe('now');
    expect(formatRelativeTime('en', now - 86_400_000, now)).toBe('yesterday');
  });

  it('honours the locale', () => {
    expect(formatRelativeTime('de', now - 5 * 60_000, now)).toBe('vor 5 Minuten');
  });

  it('keeps the intended language for an underscore-separated tag', () => {
    expect(formatRelativeTime('de_DE', now - 5 * 60_000, now)).toBe(
      'vor 5 Minuten',
    );
  });

  it('falls back to the runtime locale for a structurally invalid tag', () => {
    expect(() => formatRelativeTime('not a locale!', now - 60_000, now)).not.toThrow();
    expect(() => formatRelativeTime('', now - 60_000, now)).not.toThrow();
    expect(formatRelativeTime('', now - 60_000, now)).toEqual(
      expect.any(String),
    );
  });
});
