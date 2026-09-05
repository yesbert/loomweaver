import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ASSIGNEES, type Assignee, type TicketStatus, ticketStore } from '../tickets/ticket-store';

const STATUSES: readonly TicketStatus[] = ['open', 'in progress', 'done'];

@Component({
  selector: 'lw-tickets-view',
  templateUrl: './tickets-view.html',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TicketsView {
  protected readonly tickets = ticketStore.tickets;

  protected readonly selected = ticketStore.selected;

  protected readonly assignees = ASSIGNEES;

  protected readonly statuses = STATUSES;

  protected stateKey(status: TicketStatus): string {
    return `tickets.states.${status === 'in progress' ? 'inProgress' : status}`;
  }

  protected open(number: string): void {
    ticketStore.open(number);
  }

  protected assign(number: string, event: Event): void {
    ticketStore.assign(number, chosen(event) as Assignee);
  }

  protected setStatus(number: string, event: Event): void {
    ticketStore.setStatus(number, chosen(event) as TicketStatus);
  }

  protected send(number: string, field: HTMLTextAreaElement): void {
    const text = field.value.trim();
    if (!text) {
      return;
    }
    ticketStore.reply(number, text);
    field.value = '';
  }
}

function chosen(event: Event): string {
  return (event as CustomEvent<{ value: string }>).detail.value;
}
