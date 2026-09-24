import { isoDaysFromToday, setReferenceDate } from './clock';

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
});
