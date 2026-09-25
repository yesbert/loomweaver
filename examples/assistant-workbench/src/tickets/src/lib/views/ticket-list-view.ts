import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ticketActions } from '../plugin/ticket-actions';
import { statusKey, ticketStore } from '../tickets/ticket-store';

@Component({
  selector: 'app-ticket-list-view',
  templateUrl: './ticket-list-view.html',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketListView {
  protected readonly tickets = ticketStore.tickets;

  protected readonly activeNumber = computed(() => ticketActions.activeNumber());

  protected readonly statusKey = statusKey;

  protected preview(number: string): void {
    ticketActions.open(number, { preview: true });
  }

  protected keep(number: string): void {
    ticketActions.keep(number);
  }
}
