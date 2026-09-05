import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { journal } from '../accounting';
import { dateIn, language, moneyIn, sum } from './finance-view-model';

@Component({
  selector: 'lw-ledger-view',
  imports: [TranslocoPipe],
  templateUrl: './ledger-view.html',
})
export class LedgerView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    const money = moneyIn(() => this.lang());
    const date = dateIn(() => this.lang());
    return journal().map((entry) => ({
      entry,
      bookedOn: date(entry.bookedOn),
      debit: entry.debit === 0 ? '' : money(entry.debit),
      credit: entry.credit === 0 ? '' : money(entry.credit),
    }));
  });

  protected readonly balanced = computed(() => {
    const lines = journal();
    return (
      sum(lines.map((line) => line.debit)) === sum(lines.map((line) => line.credit))
    );
  });
}
