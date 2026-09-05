import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { daysOverdue, dunningLevel, openAmount, overdueReceivables } from '../accounting';
import { financeActions } from './finance-actions';
import { customerName, language, moneyIn } from './finance-view-model';

@Component({
  selector: 'lw-dunning-view',
  imports: [TranslocoPipe],
  templateUrl: './dunning-view.html',
})
export class DunningView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    const money = moneyIn(() => this.lang());
    return overdueReceivables().map((entry) => ({
      entry,
      customer: customerName(entry.customerId),
      open: money(openAmount(entry)),
      overdue: daysOverdue(entry.dueOn),
      level: dunningLevel(entry),
    }));
  });

  protected run(): void {
    void financeActions.dunningRun();
  }
}
