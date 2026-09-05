import type { PluginContext } from '@loomweaver/plugin-sdk';
import { type Ticket, ticketStore } from '../tickets/ticket-store';

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
      path: `tickets/${ticket.number}`,
      title: ticket.number,
      titleIsLiteral: true,
      icon: 'tickets',
      preview: options.preview ?? false,
    });
    return ticket;
  },

  keep(number: string): void {
    this.open(number);
    ctx?.keepContentTab(`tickets/${number}`);
  },

  activeNumber(): string | undefined {
    const active = ctx?.activeContent();
    return active?.surfaceId === 'tickets.ticket' ? active.params['number'] : undefined;
  },
};
