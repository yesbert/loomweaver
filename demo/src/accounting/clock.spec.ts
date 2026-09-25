import { daysSince, daysUntil, isoDaysFromToday, recentMonths, setReferenceDate } from './clock';

describe('the demo clock east of UTC', () => {
  beforeEach(() => vi.stubEnv('TZ', 'Europe/Berlin'));

  afterEach(() => {
    setReferenceDate(null);
    vi.unstubAllEnvs();
  });

  it('names the local date just after local midnight', () => {
    setReferenceDate(new Date('2026-06-15T22:30:00Z'));

    expect(isoDaysFromToday(0)).toBe('2026-06-16');
  });

  it('counts days in the local calendar', () => {
    setReferenceDate(new Date('2026-06-15T22:30:00Z'));

    expect(isoDaysFromToday(-16)).toBe('2026-05-31');
  });

  it('counts whole calendar days to and from a date, whatever the hour', () => {
    setReferenceDate(new Date('2026-06-15T22:30:00Z'));
    expect(daysSince('2026-06-10')).toBe(6);
    expect(daysUntil('2026-06-20')).toBe(4);

    setReferenceDate(new Date('2026-06-16T21:30:00Z'));
    expect(daysSince('2026-06-10')).toBe(6);
  });

  it('lists the recent months newest first, from the local month', () => {
    setReferenceDate(new Date('2025-12-31T23:30:00Z'));

    expect(recentMonths(3)).toEqual(['2026-01', '2025-12', '2025-11']);
  });
});
