import { DocumentLine, lineNet, totalsOf } from './document';
import { roundCents } from './money';

function line(partial: Partial<DocumentLine> & { unitPrice: number }): DocumentLine {
  return {
    id: partial.id ?? 'l',
    descriptionKey: 'article.consulting',
    quantity: partial.quantity ?? 1,
    unit: 'hour',
    taxRate: partial.taxRate ?? 19,
    discountPercent: partial.discountPercent,
    unitPrice: partial.unitPrice,
  };
}

describe('lineNet', () => {
  it('multiplies quantity by unit price', () => {
    expect(lineNet(line({ quantity: 3, unitPrice: 14500 }))).toBe(43500);
  });

  it('rounds a discounted line to the cent: 3 × 33.33 less 10% is 89.991, and the line owes 89.99', () => {
    expect(lineNet(line({ quantity: 3, unitPrice: 3333, discountPercent: 10 }))).toBe(8999);
  });
});

describe('totalsOf', () => {
  it('groups net by tax rate, highest first', () => {
    const totals = totalsOf([
      line({ id: 'a', unitPrice: 10000, taxRate: 19 }),
      line({ id: 'b', unitPrice: 5000, taxRate: 7 }),
    ]);

    expect(totals.buckets.map((bucket) => bucket.rate)).toEqual([19, 7]);
    expect(totals.net).toBe(15000);
    expect(totals.tax).toBe(1900 + 350);
    expect(totals.gross).toBe(15000 + 1900 + 350);
  });

  it('taxes the summed net, so two lines of 10.50 owe 3.99 where per-line rounding of 1.995 would report 4.00', () => {
    const lines = [line({ id: 'a', unitPrice: 1050 }), line({ id: 'b', unitPrice: 1050 })];

    const perLine = lines.reduce((sum, l) => sum + roundCents(lineNet(l) * 0.19), 0);
    expect(perLine).toBe(400);

    expect(totalsOf(lines).tax).toBe(399);
  });

  it('has no buckets and no total for an empty document', () => {
    expect(totalsOf([])).toEqual({ net: 0, buckets: [], tax: 0, gross: 0 });
  });
});
