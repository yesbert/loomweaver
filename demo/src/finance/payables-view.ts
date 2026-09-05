import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { payables, payablesOutstanding } from '../accounting';
import { dateIn, language, moneyIn } from './finance-view-model';

@Component({
  selector: 'lw-payables-view',
  imports: [TranslocoPipe],
  templateUrl: './payables-view.html',
})
export class PayablesView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    const money = moneyIn(() => this.lang());
    const date = dateIn(() => this.lang());
    return payables().map((entry) => ({
      entry,
      due: date(entry.dueOn),
      gross: money(entry.gross),
    }));
  });

  protected readonly outstanding = computed(() =>
    moneyIn(() => this.lang())(payablesOutstanding()),
  );
}
