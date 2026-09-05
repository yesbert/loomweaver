import { Plugin } from '@loomweaver/plugin-sdk';
import { TicketListView } from '../views/ticket-list-view';
import { TicketView } from '../views/ticket-view';
import { ASSIGNEES, type Assignee, type TicketStatus, ticketStore } from '../tickets/ticket-store';
import { ticketActions } from './tickets-actions';

const STATUSES: readonly TicketStatus[] = ['open', 'in progress', 'done'];

const icon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>';

export const ticketsPlugin: Plugin = {
  manifest: {
    id: 'tickets',
    name: 'Tickets',
    capabilities: ['contributions', 'ui', 'navigation'],
  },
  activate(ctx) {
    ctx.contributeIcons({ tickets: icon });
    ticketActions.bind(ctx);

    ctx.registerCommand({
      id: 'tickets.list',
      title: 'tickets.list.title',
      description: 'tickets.list.description',
      arguments: [
        { name: 'status', kind: 'choice', choices: STATUSES, description: 'tickets.list.status' },
      ],
      answers: 'tickets.list.answers',
      callable: true,
      run: (_context, args) => ticketStore.list(args?.['status'] as TicketStatus | undefined),
    });

    ctx.registerCommand({
      id: 'tickets.open',
      title: 'tickets.open.title',
      description: 'tickets.open.description',
      arguments: [
        { name: 'number', kind: 'text', required: true, description: 'tickets.open.number' },
      ],
      answers: 'tickets.open.answers',
      callable: true,
      run: (_context, args) => {
        const opened = ticketActions.open(String(args?.['number']));
        return { ...opened, replies: opened.replies.map((reply) => reply.text) };
      },
    });

    ctx.registerCommand({
      id: 'tickets.assign',
      title: 'tickets.assign.title',
      description: 'tickets.assign.description',
      arguments: [
        { name: 'number', kind: 'text', required: true, description: 'tickets.open.number' },
        { name: 'to', kind: 'choice', choices: ASSIGNEES, required: true, description: 'tickets.assign.to' },
      ],
      answers: 'tickets.assign.answers',
      callable: true,
      run: (_context, args) => {
        const changed = ticketStore.assign(String(args?.['number']), args?.['to'] as Assignee);
        ticketActions.open(changed.number);
        return changed;
      },
    });

    ctx.registerCommand({
      id: 'tickets.reply',
      title: 'tickets.reply.title',
      description: 'tickets.reply.description',
      arguments: [
        { name: 'number', kind: 'text', required: true, description: 'tickets.open.number' },
        { name: 'text', kind: 'text', required: true, description: 'tickets.reply.text' },
      ],
      answers: 'tickets.reply.answers',
      callable: true,
      run: (_context, args) => {
        const changed = ticketStore.reply(String(args?.['number']), String(args?.['text']));
        ticketActions.open(changed.number);
        return changed;
      },
    });

    ctx.registerCommand({
      id: 'tickets.status',
      title: 'tickets.status.title',
      description: 'tickets.status.description',
      arguments: [
        { name: 'number', kind: 'text', required: true, description: 'tickets.open.number' },
        { name: 'status', kind: 'choice', choices: STATUSES, required: true, description: 'tickets.status.status' },
      ],
      answers: 'tickets.status.answers',
      callable: true,
      run: (_context, args) => {
        const changed = ticketStore.setStatus(String(args?.['number']), args?.['status'] as TicketStatus);
        ticketActions.open(changed.number);
        return changed;
      },
    });

    ctx.registerSurface({
      id: 'tickets',
      title: 'tickets.title',
      icon: 'tickets',
      component: TicketListView,
      docks: ['left-panel'],
    });

    ctx.registerSurface({
      id: 'tickets.ticket',
      title: 'tickets.ticket.title',
      icon: 'tickets',
      component: TicketView,
      routable: { path: 'tickets/:number' },
    });
  },
  deactivate() {
    ticketActions.unbind();
  },
};
