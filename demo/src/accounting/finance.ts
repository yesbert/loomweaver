import { computed, signal } from '@angular/core';
import { type Cents } from './money';
import { isoDaysFromToday, today } from './clock';

export type ReceivableState = 'open' | 'settled';

export interface Receivable {
  readonly id: string;
  readonly number: string;
  readonly customerId: string;
  readonly issuedOn: string;
  readonly dueOn: string;
  readonly gross: Cents;
  readonly settled: Cents;
  readonly remindersSent: number;
}

export interface Payable {
  readonly id: string;
  readonly number: string;
  readonly supplier: string;
  readonly issuedOn: string;
  readonly dueOn: string;
  readonly gross: Cents;
  readonly approved: boolean;
}

export interface JournalEntry {
  readonly id: string;
  readonly bookedOn: string;
  readonly account: string;
  readonly reference: string;
  readonly debit: Cents;
  readonly credit: Cents;
}

export interface Period {
  readonly id: string;
  readonly month: string;
  readonly closed: boolean;
  readonly openItems: number;
}

interface ReceivableSeed {
  readonly id: string;
  readonly number: string;
  readonly customerId: string;
  readonly issuedDaysAgo: number;
  readonly termDays: number;
  readonly gross: Cents;
  readonly settled?: Cents;
  readonly remindersSent?: number;
}

const RECEIVABLE_SEEDS: readonly ReceivableSeed[] = [
  { id: 'r-1', number: 'RE-2043', customerId: 'c-nordwind', issuedDaysAgo: 52, termDays: 14, gross: 1_826_412 },
  { id: 'r-2', number: 'RE-2044', customerId: 'c-kranich', issuedDaysAgo: 41, termDays: 14, gross: 449_425, remindersSent: 1 },
  { id: 'r-3', number: 'RE-2045', customerId: 'c-steinweg', issuedDaysAgo: 22, termDays: 30, gross: 738_990 },
  { id: 'r-4', number: 'RE-2046', customerId: 'c-nordwind', issuedDaysAgo: 12, termDays: 30, gross: 264_180, settled: 264_180 },
  { id: 'r-5', number: 'RE-2047', customerId: 'c-talbach', issuedDaysAgo: 4, termDays: 30, gross: 1_192_500 },
];

const PAYABLE_SEEDS: readonly (Omit<Payable, 'issuedOn' | 'dueOn'> & {
  readonly issuedDaysAgo: number;
  readonly termDays: number;
})[] = [
  { id: 'p-1', number: 'ER-8871', supplier: 'Papierwerk Elbe GmbH', issuedDaysAgo: 26, termDays: 14, gross: 312_400, approved: true },
  { id: 'p-2', number: 'ER-8872', supplier: 'Rechenzentrum Nord AG', issuedDaysAgo: 9, termDays: 30, gross: 1_071_000, approved: true },
  { id: 'p-3', number: 'ER-8873', supplier: 'Kontorhaus Verwaltung', issuedDaysAgo: 3, termDays: 30, gross: 486_500, approved: false },
];

function dated<T extends { issuedDaysAgo: number; termDays: number }>(seed: T) {
  return {
    issuedOn: isoDaysFromToday(-seed.issuedDaysAgo),
    dueOn: isoDaysFromToday(seed.termDays - seed.issuedDaysAgo),
  };
}

function seededReceivables(): readonly Receivable[] {
  return RECEIVABLE_SEEDS.map((seed) => ({
    id: seed.id,
    number: seed.number,
    customerId: seed.customerId,
    gross: seed.gross,
    settled: seed.settled ?? 0,
    remindersSent: seed.remindersSent ?? 0,
    ...dated(seed),
  }));
}

function seededPayables(): readonly Payable[] {
  return PAYABLE_SEEDS.map(({ issuedDaysAgo, termDays, ...rest }) => ({
    ...rest,
    ...dated({ issuedDaysAgo, termDays }),
  }));
}

const receivableStore = signal<readonly Receivable[]>(seededReceivables());
const payableStore = signal<readonly Payable[]>(seededPayables());

export const receivables = receivableStore.asReadonly();
export const payables = payableStore.asReadonly();

export function resetFinance(): void {
  receivableStore.set(seededReceivables());
  payableStore.set(seededPayables());
}

export function stateOf(receivable: Receivable): ReceivableState {
  return receivable.settled >= receivable.gross ? 'settled' : 'open';
}

export function openAmount(receivable: Receivable): Cents {
  return receivable.gross - receivable.settled;
}

export function daysOverdue(dueOn: string): number {
  const due = new Date(dueOn).getTime();
  return Math.floor((today().getTime() - due) / 86_400_000);
}

export const openReceivables = computed(() =>
  receivables().filter((entry) => stateOf(entry) === 'open'),
);

export const overdueReceivables = computed(() =>
  openReceivables().filter((entry) => daysOverdue(entry.dueOn) > 0),
);

export const receivablesOutstanding = computed(() =>
  openReceivables().reduce((sum, entry) => sum + openAmount(entry), 0),
);

export const payablesOutstanding = computed(() =>
  payables().reduce((sum, entry) => sum + entry.gross, 0),
);

export function dunningLevel(receivable: Receivable): number {
  const overdue = daysOverdue(receivable.dueOn);
  if (overdue <= 0) {
    return 0;
  }
  return Math.min(3, receivable.remindersSent + 1);
}

export function startDunningRun(): number {
  const due = overdueReceivables();
  if (due.length === 0) {
    return 0;
  }
  const reminded = new Set(due.map((entry) => entry.id));
  receivableStore.update((all) =>
    all.map((entry) =>
      reminded.has(entry.id)
        ? { ...entry, remindersSent: entry.remindersSent + 1 }
        : entry,
    ),
  );
  return reminded.size;
}

export const journal = computed<readonly JournalEntry[]>(() => {
  const fromReceivables = receivables().flatMap<JournalEntry>((entry) => [
    {
      id: `${entry.id}-r`,
      bookedOn: entry.issuedOn,
      account: '1400 Forderungen',
      reference: entry.number,
      debit: entry.gross,
      credit: 0,
    },
    {
      id: `${entry.id}-e`,
      bookedOn: entry.issuedOn,
      account: '8400 Erlöse',
      reference: entry.number,
      debit: 0,
      credit: entry.gross,
    },
  ]);
  const fromPayables = payables().flatMap<JournalEntry>((entry) => [
    {
      id: `${entry.id}-a`,
      bookedOn: entry.issuedOn,
      account: '6000 Aufwand',
      reference: entry.number,
      debit: entry.gross,
      credit: 0,
    },
    {
      id: `${entry.id}-v`,
      bookedOn: entry.issuedOn,
      account: '1600 Verbindlichkeiten',
      reference: entry.number,
      debit: 0,
      credit: entry.gross,
    },
  ]);
  return [...fromReceivables, ...fromPayables].sort((a, b) =>
    b.bookedOn.localeCompare(a.bookedOn),
  );
});

export const periods = computed<readonly Period[]>(() => {
  const now = today();
  return [0, 1, 2].map((back) => {
    const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const month = date.toISOString().slice(0, 7);
    const openItems = openReceivables().filter((entry) =>
      entry.issuedOn.startsWith(month),
    ).length;
    return {
      id: month,
      month,
      closed: back > 1,
      openItems,
    };
  });
});
