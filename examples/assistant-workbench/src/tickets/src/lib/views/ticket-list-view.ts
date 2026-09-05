import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ticketActions } from '../plugin/tickets-actions';
import { type TicketStatus, ticketStore } from '../tickets/ticket-store';

@Component({
  selector: 'lw-ticket-list-view',
  templateUrl: './ticket-list-view.html',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketListView {
  protected readonly tickets = ticketStore.tickets;

  protected readonly activeNumber = computed(() => ticketActions.activeNumber());

  protected stateKey(status: TicketStatus): string {
    return `tickets.states.${status === 'in progress' ? 'inProgress' : status}`;
  }

  protected preview(number: string): void {
    ticketActions.open(number, { preview: true });
  }

  protected keep(number: string): void {
    ticketActions.keep(number);
  }
}
