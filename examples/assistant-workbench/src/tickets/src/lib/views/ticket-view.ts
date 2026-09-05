import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { ASSIGNEES, type Assignee, type TicketStatus, ticketStore } from '../tickets/ticket-store';

const STATUSES: readonly TicketStatus[] = ['open', 'in progress', 'done'];

@Component({
  selector: 'lw-ticket-view',
  templateUrl: './ticket-view.html',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TicketView {
  protected readonly assignees = ASSIGNEES;

  protected readonly statuses = STATUSES;

  private readonly params = toSignal(inject(ActivatedRoute).paramMap);

  protected readonly ticket = computed(() => {
    const number = this.params()?.get('number');
    return ticketStore.tickets().find((one) => one.number === number);
  });

  protected stateKey(status: TicketStatus): string {
    return `tickets.states.${status === 'in progress' ? 'inProgress' : status}`;
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
