import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { payables, payablesOutstanding } from './books';
import { formatDate, formatMoney, supplierName } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'demo-payables-view',
  imports: [TranslocoPipe],
  templateUrl: './payables-view.html',
})
export class PayablesView {
  protected readonly columns = '7rem minmax(0,1fr) 8rem 10rem 8rem';

  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return payables().map((entry) => ({
      entry,
      supplier: supplierName(entry.supplierId),
      due: formatDate(entry.dueOn, lang),
      gross: formatMoney(entry.gross, lang),
    }));
  });

  protected readonly outstanding = computed(() =>
    formatMoney(payablesOutstanding(), this.lang()),
  );
}
