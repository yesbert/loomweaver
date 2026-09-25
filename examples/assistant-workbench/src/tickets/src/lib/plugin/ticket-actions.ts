import type { PluginContext } from '@loomweaver/plugin-sdk';
import {
  type Assignee,
  type Ticket,
  type TicketStatus,
  type TicketSummary,
  ticketStore,
} from '../tickets/ticket-store';

export const TICKET_SURFACE = 'tickets.ticket';

export function ticketPath(number: string): string {
  return `tickets/${number}`;
}

let ctx: PluginContext | undefined;

export const ticketActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },

  unbind(): void {
    ctx = undefined;
  },

  open(number: string, options: { preview?: boolean } = {}): Ticket {
    const ticket = ticketStore.get(number);
    ctx?.openContentTab({
      path: ticketPath(ticket.number),
      title: ticket.number,
      titleIsLiteral: true,
      icon: 'tickets',
      preview: options.preview ?? false,
    });
    return ticket;
  },

  keep(number: string): void {
    this.open(number);
    ctx?.keepContentTab(ticketPath(number));
  },

  assign(number: string, to: Assignee): TicketSummary {
    return shown(ticketStore.assign(number, to));
  },

  reply(number: string, text: string): TicketSummary {
    return shown(ticketStore.reply(number, text));
  },

  setStatus(number: string, status: TicketStatus): TicketSummary {
    return shown(ticketStore.setStatus(number, status));
  },

  activeNumber(): string | undefined {
    const active = ctx?.activeContent();
    return active?.surfaceId === TICKET_SURFACE ? active.params['number'] : undefined;
  },
};

function shown(changed: TicketSummary): TicketSummary {
  ticketActions.open(changed.number);
  return changed;
}
