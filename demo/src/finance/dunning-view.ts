import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { daysOverdue, dunningLevel, openAmount, overdueReceivables } from './books';
import { customerName, formatMoney } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'demo-dunning-view',
  imports: [TranslocoPipe],
  templateUrl: './dunning-view.html',
})
export class DunningView {
  protected readonly columns = '7rem minmax(0,1fr) 9rem 6rem 8rem';

  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return overdueReceivables().map((entry) => ({
      entry,
      customer: customerName(entry.customerId),
      open: formatMoney(openAmount(entry), lang),
      overdue: daysOverdue(entry.dueOn),
      level: dunningLevel(entry),
    }));
  });
}
