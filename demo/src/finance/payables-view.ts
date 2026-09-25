import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { payables, payablesOutstanding } from './books';
import { formatDate, formatMoney } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'lw-payables-view',
  imports: [TranslocoPipe],
  templateUrl: './payables-view.html',
})
export class PayablesView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return payables().map((entry) => ({
      entry,
      due: formatDate(entry.dueOn, lang),
      gross: formatMoney(entry.gross, lang),
    }));
  });

  protected readonly outstanding = computed(() =>
    formatMoney(payablesOutstanding(), this.lang()),
  );
}
