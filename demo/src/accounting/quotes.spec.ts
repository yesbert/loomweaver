import { setReferenceDate } from './clock';
import { formatMoney, roundCents } from './money';
import { customerById } from './catalog';
import { quoteById, quoteTotals, quotes, resetQuotes } from './quotes';

describe('quote seed data', () => {
  it('gives every quote a unique number and a known customer', () => {
    const numbers = quotes().map((quote) => quote.number);
    expect(new Set(numbers).size).toBe(numbers.length);

    for (const quote of quotes()) {
      expect(customerById(quote.customerId)).toBeDefined();
      expect(quote.lines.length).toBeGreaterThan(0);
    }
  });

  it('dates every quote before the day it expires', () => {
    for (const quote of quotes()) {
      expect(quote.validUntil > quote.issuedOn).toBe(true);
    }
  });

  it('carries a document with two tax rates, so the totals block has something to show', () => {
    const mixed = quotes().filter((quote) => quoteTotals(quote).buckets.length > 1);
    expect(mixed.length).toBeGreaterThan(0);
  });

  it('finds a quote by id and nothing by an unknown one', () => {
    expect(quoteById('q-0007')?.number).toContain('0007');
    expect(quoteById('nope')).toBeUndefined();
  });
});

describe('presentation helpers', () => {
  it('formats money per locale', () => {
    expect(formatMoney(145000, 'de').replace(/ /g, ' ')).toBe('1.450,00 €');
    expect(formatMoney(145000, 'en').replace(/ /g, ' ')).toBe('€1,450.00');
  });

  it('rounds half away from zero, so credit notes do not drift', () => {
    expect(roundCents(0.5)).toBe(1);
    expect(roundCents(-0.5)).toBe(-1);
  });
});

describe('the reference date seam', () => {
  afterEach(() => {
    setReferenceDate(null);
    resetQuotes();
  });

  it('dates the seeds against the reference date', () => {
    setReferenceDate(new Date('2030-06-10T00:00:00Z'));
    resetQuotes();

    const newest = quotes()[0];
    expect(newest.issuedOn).toBe('2030-06-08');
    expect(newest.validUntil).toBe('2030-07-08');
  });

  it('numbers a quote the same whatever day it is read on', () => {
    setReferenceDate(new Date('2026-12-31T00:00:00Z'));
    resetQuotes();
    const before = quotes().map((quote) => quote.number);

    setReferenceDate(new Date('2027-03-05T00:00:00Z'));
    resetQuotes();

    expect(quotes().map((quote) => quote.number)).toEqual(before);
  });
});
