import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { daysOverdue, openAmount, receivables, receivablesOutstanding, stateOf } from './books';
import { customerName, formatDate, formatMoney } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'lw-receivables-view',
  imports: [TranslocoPipe],
  templateUrl: './receivables-view.html',
})
export class ReceivablesView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return receivables().map((entry) => ({
      entry,
      customer: customerName(entry.customerId),
      due: formatDate(entry.dueOn, lang),
      gross: formatMoney(entry.gross, lang),
      open: formatMoney(openAmount(entry), lang),
      overdue: daysOverdue(entry.dueOn),
      state: stateOf(entry),
    }));
  });

  protected readonly outstanding = computed(() =>
    formatMoney(receivablesOutstanding(), this.lang()),
  );
}
