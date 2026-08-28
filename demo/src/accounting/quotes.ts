import { computed, signal } from '@angular/core';
import { isoDaysFromToday } from './clock';
import { DocumentLine, DocumentTotals, totalsOf } from './document';
import { articleById } from './catalog';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface Quote {
  readonly id: string;
  readonly number: string;
  readonly customerId: string;
  readonly issuedOn: string;
  readonly validUntil: string;
  readonly status: QuoteStatus;
  readonly lines: readonly DocumentLine[];
}

interface LineSeed {
  readonly articleId: string;
  readonly quantity: number;
  readonly discountPercent?: number;
}

interface QuoteSeed {
  readonly id: string;
  readonly seq: number;
  readonly customerId: string;
  readonly issuedDaysAgo: number;
  readonly validForDays: number;
  readonly status: QuoteStatus;
  readonly lines: readonly LineSeed[];
}

const SEEDS: readonly QuoteSeed[] = [
  {
    id: 'q-0007', seq: 7, customerId: 'c-nordwind', issuedDaysAgo: 2, validForDays: 30, status: 'sent',
    lines: [
      { articleId: 'a-consulting', quantity: 24 },
      { articleId: 'a-development', quantity: 80 },
      { articleId: 'a-hosting', quantity: 12 },
    ],
  },
  {
    id: 'q-0006', seq: 6, customerId: 'c-kranich', issuedDaysAgo: 5, validForDays: 21, status: 'sent',
    lines: [
      { articleId: 'a-workshop', quantity: 2 },
      { articleId: 'a-handbook', quantity: 25 },
    ],
  },
  {
    id: 'q-0005', seq: 5, customerId: 'c-steinweg', issuedDaysAgo: 9, validForDays: 30, status: 'accepted',
    lines: [
      { articleId: 'a-consulting', quantity: 12 },
      { articleId: 'a-support', quantity: 12, discountPercent: 10 },
    ],
  },
  {
    id: 'q-0004', seq: 4, customerId: 'c-vitalis', issuedDaysAgo: 14, validForDays: 14, status: 'draft',
    lines: [{ articleId: 'a-development', quantity: 40 }],
  },
  {
    id: 'q-0003', seq: 3, customerId: 'c-talbach', issuedDaysAgo: 26, validForDays: 30, status: 'accepted',
    lines: [
      { articleId: 'a-workshop', quantity: 4 },
      { articleId: 'a-consulting', quantity: 16, discountPercent: 5 },
      { articleId: 'a-handbook', quantity: 60 },
    ],
  },
  {
    id: 'q-0002', seq: 2, customerId: 'c-auerbach', issuedDaysAgo: 41, validForDays: 21, status: 'declined',
    lines: [{ articleId: 'a-support', quantity: 24 }],
  },
  {
    id: 'q-0001', seq: 1, customerId: 'c-nordwind', issuedDaysAgo: 63, validForDays: 30, status: 'expired',
    lines: [
      { articleId: 'a-consulting', quantity: 8 },
      { articleId: 'a-hosting', quantity: 6 },
    ],
  },
];

function buildLines(seeds: readonly LineSeed[], quoteId: string): readonly DocumentLine[] {
  return seeds.map((seed, index) => {
    const article = articleById(seed.articleId);
    if (!article) {
      throw new Error(`Unknown article in seed data: ${seed.articleId}`);
    }
    return {
      id: `${quoteId}-l${index + 1}`,
      articleId: article.id,
      descriptionKey: article.descriptionKey,
      quantity: seed.quantity,
      unit: article.unit,
      unitPrice: article.unitPrice,
      taxRate: article.taxRate,
      discountPercent: seed.discountPercent,
    };
  });
}

function buildQuote(seed: QuoteSeed): Quote {
  const issuedOn = isoDaysFromToday(-seed.issuedDaysAgo);
  return {
    id: seed.id,
    number: `Q-${String(seed.seq).padStart(4, '0')}`,
    customerId: seed.customerId,
    issuedOn,
    validUntil: isoDaysFromToday(-seed.issuedDaysAgo + seed.validForDays),
    status: seed.status,
    lines: buildLines(seed.lines, seed.id),
  };
}

const store = signal<readonly Quote[]>(SEEDS.map(buildQuote));

export const quotes = store.asReadonly();

export function resetQuotes(): void {
  store.set(SEEDS.map(buildQuote));
}

export function markQuoteSent(id: string): void {
  store.update((all) =>
    all.map((quote) => (quote.id === id ? { ...quote, status: 'sent' } : quote)),
  );
}

export const openQuoteValue = computed(() =>
  store()
    .filter((quote) => quote.status === 'sent')
    .reduce((sum, quote) => sum + totalsOf(quote.lines).gross, 0),
);

export function quoteById(id: string): Quote | undefined {
  return store().find((quote) => quote.id === id);
}

export function quoteTotals(quote: Quote): DocumentTotals {
  return totalsOf(quote.lines);
}
