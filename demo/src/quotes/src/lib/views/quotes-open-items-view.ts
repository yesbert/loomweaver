import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  type Quote,
  customerById,
  formatMoney,
  quoteTotals,
  quotes,
  today,
} from '../../../../accounting';
import { quotesActions } from '../plugin/quotes-actions';

export interface OpenItemRow {
  readonly quote: Quote;
  readonly customer: string;
  readonly total: string;
  readonly daysLeft: number;
}

function daysBetween(iso: string): number {
  const due = new Date(iso).getTime();
  return Math.round((due - today().getTime()) / 86_400_000);
}

@Component({
  selector: 'lw-quotes-open-items-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './quotes-open-items-view.html',
})
export class QuotesOpenItemsView {
  private readonly transloco = inject(TranslocoService);
  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly rows = computed<readonly OpenItemRow[]>(() => {
    const lang = this.lang();
    return quotes()
      .filter((quote) => quote.status === 'sent')
      .map((quote) => ({
        quote,
        customer: customerById(quote.customerId)?.name ?? quote.customerId,
        total: formatMoney(quoteTotals(quote).gross, lang),
        daysLeft: daysBetween(quote.validUntil),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  });

  protected open(row: OpenItemRow): void {
    quotesActions.keep(row.quote);
  }
}
