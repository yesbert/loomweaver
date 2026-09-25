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

interface AwaitingRow {
  readonly quote: Quote;
  readonly customer: string;
  readonly total: string;
  readonly daysLeft: number;
}

@Component({
  selector: 'demo-quotes-awaiting-answer-view',
  imports: [TranslocoPipe],
  templateUrl: './quotes-awaiting-answer-view.html',
})
export class QuotesAwaitingAnswerView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed<readonly AwaitingRow[]>(() => {
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

  protected open(row: AwaitingRow): void {
    quotesActions.keep(row.quote);
  }
}
