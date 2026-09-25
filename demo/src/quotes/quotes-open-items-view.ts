import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  customerById,
  daysUntil,
  formatMoney,
  type Quote,
  quotes,
  quoteTotals,
} from '../accounting';
import { quotesActions } from './quotes-actions';
import { activeLanguage } from '../i18n/active-language';

interface OpenItemRow {
  readonly quote: Quote;
  readonly customer: string;
  readonly total: string;
  readonly daysLeft: number;
}

@Component({
  selector: 'lw-quotes-open-items-view',
  imports: [TranslocoPipe],
  templateUrl: './quotes-open-items-view.html',
})
export class QuotesOpenItemsView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed<readonly OpenItemRow[]>(() => {
    const lang = this.lang();
    return quotes()
      .filter((quote) => quote.status === 'sent')
      .map((quote) => ({
        quote,
        customer: customerById(quote.customerId)?.name ?? quote.customerId,
        total: formatMoney(quoteTotals(quote).gross, lang),
        daysLeft: daysUntil(quote.validUntil),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  });

  protected open(row: OpenItemRow): void {
    quotesActions.keep(row.quote);
  }
}
