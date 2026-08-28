import { Cents, roundCents } from './money';

export type TaxRate = 19 | 7 | 0;

export type Unit = 'hour' | 'day' | 'piece' | 'month';

export interface DocumentLine {
  readonly id: string;
  readonly articleId?: string;
  readonly descriptionKey: string;
  readonly quantity: number;
  readonly unit: Unit;
  readonly unitPrice: Cents;
  readonly taxRate: TaxRate;
  readonly discountPercent?: number;
}

export interface TaxBucket {
  readonly rate: TaxRate;
  readonly net: Cents;
  readonly tax: Cents;
}

export interface DocumentTotals {
  readonly net: Cents;
  readonly buckets: readonly TaxBucket[];
  readonly tax: Cents;
  readonly gross: Cents;
}

export function lineNet(line: DocumentLine): Cents {
  const gross = line.quantity * line.unitPrice;
  const discount = gross * ((line.discountPercent ?? 0) / 100);
  return roundCents(gross - discount);
}

export function totalsOf(lines: readonly DocumentLine[]): DocumentTotals {
  const nets = new Map<TaxRate, Cents>();
  for (const line of lines) {
    nets.set(line.taxRate, (nets.get(line.taxRate) ?? 0) + lineNet(line));
  }

  const buckets = [...nets.entries()]
    .map(([rate, net]) => ({ rate, net, tax: roundCents(net * (rate / 100)) }))
    .sort((a, b) => b.rate - a.rate);

  const net = buckets.reduce((sum, bucket) => sum + bucket.net, 0);
  const tax = buckets.reduce((sum, bucket) => sum + bucket.tax, 0);
  return { net, buckets, tax, gross: net + tax };
}
