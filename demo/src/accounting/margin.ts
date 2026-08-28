import { articleById } from './catalog';
import { DocumentLine, lineNet } from './document';
import { Cents, roundCents } from './money';

export interface MarginLine {
  readonly lineId: string;
  readonly descriptionKey: string;
  readonly revenue: Cents;
  readonly cost: Cents;
  readonly margin: Cents;
  readonly percent: number;
}

export interface DocumentMargin {
  readonly revenue: Cents;
  readonly cost: Cents;
  readonly margin: Cents;
  readonly percent: number;
  readonly lines: readonly MarginLine[];
}

function percentOf(margin: Cents, revenue: Cents): number {
  return revenue === 0 ? 0 : Math.round((margin / revenue) * 1000) / 10;
}

function costOf(line: DocumentLine): Cents {
  const unitCost = line.articleId ? (articleById(line.articleId)?.costPrice ?? 0) : 0;
  return roundCents(line.quantity * unitCost);
}

export function marginOf(lines: readonly DocumentLine[]): DocumentMargin {
  const rows = lines.map((line) => {
    const revenue = lineNet(line);
    const cost = costOf(line);
    const margin = revenue - cost;
    return {
      lineId: line.id,
      descriptionKey: line.descriptionKey,
      revenue,
      cost,
      margin,
      percent: percentOf(margin, revenue),
    };
  });

  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const cost = rows.reduce((sum, row) => sum + row.cost, 0);
  const margin = revenue - cost;
  return { revenue, cost, margin, percent: percentOf(margin, revenue), lines: rows };
}
