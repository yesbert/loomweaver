import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  daysOverdue,
  openAmount,
  receivables,
  receivablesOutstanding,
  stateOf,
} from '../accounting';
import { customerName, dateIn, language, moneyIn } from './finance-view-model';

@Component({
  selector: 'lw-receivables-view',
  imports: [TranslocoPipe],
  templateUrl: './receivables-view.html',
})
export class ReceivablesView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    const money = moneyIn(() => this.lang());
    const date = dateIn(() => this.lang());
    return receivables().map((entry) => ({
      entry,
      customer: customerName(entry.customerId),
      due: date(entry.dueOn),
      gross: money(entry.gross),
      open: money(openAmount(entry)),
      overdue: daysOverdue(entry.dueOn),
      state: stateOf(entry),
    }));
  });

  protected readonly outstanding = computed(() =>
    moneyIn(() => this.lang())(receivablesOutstanding()),
  );
}
