import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  type Quote,
  type QuoteStatus,
  customerById,
  formatDate,
  formatMoney,
  quoteTotals,
  quotes,
} from '../../../../accounting';
import { quotesActions } from '../plugin/quotes-actions';
import { STATUS_BADGE } from './quote-status';

type StatusFilter = QuoteStatus | 'all';

export const STATUS_FILTERS: readonly StatusFilter[] = [
  'all',
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
];

export interface QuoteRow {
  readonly quote: Quote;
  readonly customer: string;
  readonly city: string;
  readonly issuedOn: string;
  readonly validUntil: string;
  readonly total: string;
  readonly lineCount: number;
  readonly badge: string;
}

@Component({
  selector: 'lw-quotes-list-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './quotes-list-view.html',
})
export class QuotesListView {
  private readonly transloco = inject(TranslocoService);
  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly search = signal('');
  protected readonly status = signal<StatusFilter>('all');

  private readonly filtered = computed<readonly Quote[]>(() => {
    const needle = this.search().trim().toLowerCase();
    const status = this.status();

    return quotes()
      .filter((quote) => status === 'all' || quote.status === status)
      .filter((quote) => this.matches(quote, needle));
  });

  protected readonly rows = computed<readonly QuoteRow[]>(() => {
    const lang = this.lang();

    return this.filtered().map((quote) => {
      const customer = customerById(quote.customerId);
      return {
        quote,
        customer: customer?.name ?? quote.customerId,
        city: customer?.city ?? '',
        issuedOn: formatDate(quote.issuedOn, lang),
        validUntil: formatDate(quote.validUntil, lang),
        total: formatMoney(quoteTotals(quote).gross, lang),
        lineCount: quote.lines.length,
        badge: STATUS_BADGE[quote.status],
      };
    });
  });

  protected readonly activeId = computed(() => quotesActions.activeQuoteId());

  protected readonly shownCount = computed(() => this.filtered().length);
  protected readonly totalCount = computed(() => quotes().length);

  protected readonly shownTotal = computed(() =>
    formatMoney(
      this.filtered().reduce((sum, quote) => sum + quoteTotals(quote).gross, 0),
      this.lang(),
    ),
  );

  protected preview(quote: Quote): void {
    quotesActions.open(quote, { preview: true });
  }

  protected keep(quote: Quote): void {
    quotesActions.keep(quote);
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onStatus(event: Event): void {
    this.status.set((event as CustomEvent<{ value: string }>).detail.value as StatusFilter);
  }

  private matches(quote: Quote, needle: string): boolean {
    if (!needle) {
      return true;
    }
    const customer = customerById(quote.customerId);
    const haystack = [quote.number, customer?.name, customer?.city].join(' ').toLowerCase();
    return haystack.includes(needle);
  }
}
