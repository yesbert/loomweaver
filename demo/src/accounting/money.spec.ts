import { formatDate, formatMonth } from './money';

describe('calendar dates in the demo', () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(['America/Los_Angeles', 'Europe/Berlin', 'Pacific/Kiritimati'])(
    'shows a date as the date it is in %s',
    (zone) => {
      vi.stubEnv('TZ', zone);

      expect(formatDate('2026-03-01', 'en')).toBe('1 Mar 2026');
      expect(formatMonth('2026-03', 'en')).toBe('March 2026');
    },
  );
});
