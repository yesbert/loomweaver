import { setReferenceDate } from '../accounting/clock';
import {
  daysOverdue,
  dunningLevel,
  journal,
  openAmount,
  openReceivables,
  overdueReceivables,
  payablesOutstanding,
  periods,
  receivables,
  receivablesOutstanding,
  resetFinance,
  startDunningRun,
  stateOf,
} from '../accounting';

describe('finance', () => {
  beforeEach(() => {
    setReferenceDate(new Date('2026-06-15T12:00:00Z'));
    resetFinance();
  });

  afterEach(() => setReferenceDate(null));

  it('counts a receivable as open until it is settled in full', () => {
    const settled = receivables().find((entry) => entry.number === 'RE-2046');

    expect(stateOf(settled!)).toBe('settled');
    expect(openAmount(settled!)).toBe(0);
    expect(openReceivables().map((entry) => entry.number)).not.toContain('RE-2046');
  });

  it('adds up only what is still open', () => {
    expect(receivablesOutstanding()).toBe(
      openReceivables().reduce((sum, entry) => sum + openAmount(entry), 0),
    );
    expect(receivablesOutstanding()).toBeGreaterThan(0);
  });

  it('calls a receivable overdue once its due date has passed', () => {
    const overdue = overdueReceivables().map((entry) => entry.number);

    expect(overdue).toContain('RE-2043');
    expect(overdue).not.toContain('RE-2047');
    for (const entry of overdueReceivables()) {
      expect(daysOverdue(entry.dueOn)).toBeGreaterThan(0);
    }
  });

  it('raises the dunning level of every overdue receivable, and leaves the rest alone', () => {
    const before = new Map(receivables().map((entry) => [entry.number, entry.remindersSent]));
    const overdue = overdueReceivables().map((entry) => entry.number);

    const reminded = startDunningRun();

    expect(reminded).toBe(overdue.length);
    for (const entry of receivables()) {
      const expected = (before.get(entry.number) ?? 0) + (overdue.includes(entry.number) ? 1 : 0);
      expect(entry.remindersSent).toBe(expected);
    }
  });

  it('stops the dunning level at three, however often the run is started', () => {
    startDunningRun();
    startDunningRun();
    startDunningRun();
    startDunningRun();

    for (const entry of overdueReceivables()) {
      expect(dunningLevel(entry)).toBeLessThanOrEqual(3);
    }
  });

  it('books every document to two sides, so the ledger balances', () => {
    const debit = journal().reduce((sum, line) => sum + line.debit, 0);
    const credit = journal().reduce((sum, line) => sum + line.credit, 0);

    expect(journal().length).toBeGreaterThan(0);
    expect(debit).toBe(credit);
  });

  it('shows the newest booking first', () => {
    const dates = journal().map((line) => line.bookedOn);

    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it('reports what a supplier is still owed', () => {
    expect(payablesOutstanding()).toBe(1_869_900);
  });

  it('leaves the current period open and closes the older ones', () => {
    const [current, previous, older] = periods();

    expect(current.closed).toBe(false);
    expect(previous.closed).toBe(false);
    expect(older.closed).toBe(true);
  });
});
