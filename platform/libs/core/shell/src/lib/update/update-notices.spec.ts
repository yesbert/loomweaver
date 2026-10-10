import { STAYS } from '../notifications/notification-lifetime';
import { updateNotice, UpdateNotice } from './update-notices';

describe('the lifetime each update notice states', () => {
  const lifetimeOf = (notice: UpdateNotice) =>
    updateNotice(notice, () => undefined).timeoutMs;

  it.each(['waiting', 'failed', 'broken'] as const)(
    'keeps the %s notice until it is dismissed, because it offers the way out',
    (notice) => {
      expect(lifetimeOf(notice)).toBe(STAYS);
      expect(updateNotice(notice, () => undefined).action).toBeDefined();
    },
  );

  it('lets the notice that nothing is waiting leave', () => {
    expect(lifetimeOf('current')).toBe(4000);
  });

  it('lets the notice that the check went unanswered leave', () => {
    expect(lifetimeOf('unreachable')).toBe(6000);
  });
});
