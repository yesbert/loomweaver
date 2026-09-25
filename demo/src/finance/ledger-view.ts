import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { journal } from './books';
import { formatDate, formatMoney } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'lw-ledger-view',
  imports: [TranslocoPipe],
  templateUrl: './ledger-view.html',
})
export class LedgerView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return journal().map((entry) => ({
      entry,
      bookedOn: formatDate(entry.bookedOn, lang),
      debit: entry.debit === 0 ? '' : formatMoney(entry.debit, lang),
      credit: entry.credit === 0 ? '' : formatMoney(entry.credit, lang),
    }));
  });

  protected readonly balanced = computed(() => {
    const lines = journal();
    return (
      lines.reduce((total, line) => total + line.debit, 0) ===
      lines.reduce((total, line) => total + line.credit, 0)
    );
  });
}
