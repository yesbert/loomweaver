import { signal } from '@angular/core';

export type TicketStatus = 'open' | 'in progress' | 'done';

export const ASSIGNEES = ['dana', 'lee', 'sam'] as const;

export type Assignee = (typeof ASSIGNEES)[number];

export interface Reply {
  readonly at: string;
  readonly text: string;
}

export interface Ticket {
  readonly number: string;
  readonly customer: string;
  readonly subject: string;
  readonly body: string;
  readonly status: TicketStatus;
  readonly assignee: Assignee | null;
  readonly replies: readonly Reply[];
}

export interface TicketSummary {
  readonly number: string;
  readonly customer: string;
  readonly subject: string;
  readonly status: TicketStatus;
  readonly assignee: Assignee | null;
  readonly replies: number;
}

const SEED: readonly Ticket[] = [
  ticket('T-1041', 'Northwind Traders', 'Invoice PDF comes out blank', 'Since Tuesday every invoice we export from the billing page downloads as an empty PDF. The preview looks fine.'),
  ticket('T-1042', 'Contoso', 'Cannot add a second admin', 'The invite email arrives but the link says the token is invalid. Tried twice.'),
  ticket('T-1043', 'Fabrikam', 'Export to CSV drops the currency column', 'The column is visible in the table and missing in the file.'),
  ticket('T-1044', 'Tailspin Toys', 'Dashboard is slow after the update', 'Loading the overview takes about twenty seconds where it used to take two.'),
  ticket('T-1045', 'Wide World Importers', 'Password reset mail never arrives', 'Checked spam. Other mails from you arrive.'),
  ticket('T-1046', 'Adventure Works', 'Wrong VAT rate on quotes to Austria', 'Quotes show 19 percent, it should be 20 for our Austrian customers.'),
];

const tickets = signal<readonly Ticket[]>(SEED);

export const ticketStore = {
  tickets: tickets.asReadonly(),

  list(status?: TicketStatus): readonly TicketSummary[] {
    return tickets()
      .filter((one) => !status || one.status === status)
      .map(summary);
  },

  get(number: string): Ticket {
    return find(number);
  },

  assign(number: string, to: Assignee): TicketSummary {
    return summary(
      update(number, (one) => ({
        ...one,
        assignee: to,
        status: one.status === 'open' ? 'in progress' : one.status,
      })),
    );
  },

  reply(number: string, text: string): TicketSummary {
    return summary(
      update(number, (one) => ({
        ...one,
        replies: [...one.replies, { at: new Date().toISOString(), text }],
      })),
    );
  },

  setStatus(number: string, status: TicketStatus): TicketSummary {
    return summary(update(number, (one) => ({ ...one, status })));
  },

  reset(): void {
    tickets.set(SEED);
  },
};

export function summary(one: Ticket): TicketSummary {
  return {
    number: one.number,
    customer: one.customer,
    subject: one.subject,
    status: one.status,
    assignee: one.assignee,
    replies: one.replies.length,
  };
}

function ticket(number: string, customer: string, subject: string, body: string): Ticket {
  return { number, customer, subject, body, status: 'open', assignee: null, replies: [] };
}

function find(number: string): Ticket {
  const wanted = number.trim().toUpperCase();
  const found = tickets().find((one) => one.number === wanted);
  if (!found) {
    throw new Error(`There is no ticket ${number}.`);
  }
  return found;
}

function update(number: string, change: (one: Ticket) => Ticket): Ticket {
  const changed = change(find(number));
  tickets.update((all) => all.map((one) => (one.number === changed.number ? changed : one)));
  return changed;
}
