import { afterNextRender, Component, CUSTOM_ELEMENTS_SCHEMA, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { type Customer, customerById, formatDate } from '../../../../accounting';
import { quotesActions } from '../plugin/quotes-actions';
import { activeLang, quoteFromRoute } from './quote-context';
import { STATUS_BADGE } from './quote-status';

@Component({
  selector: 'lw-quotes-customer-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './quotes-customer-view.html',
})
export class QuotesCustomerView {
  private readonly lang = activeLang();

  protected readonly quote = quoteFromRoute();

  protected readonly customer = computed<Customer | undefined>(() => {
    const quote = this.quote();
    return quote ? customerById(quote.customerId) : undefined;
  });

  protected readonly badge = computed(() => {
    const quote = this.quote();
    return quote ? STATUS_BADGE[quote.status] : '';
  });

  protected readonly issuedOn = computed(() =>
    this.date(this.quote()?.issuedOn),
  );

  protected readonly validUntil = computed(() =>
    this.date(this.quote()?.validUntil),
  );

  constructor() {
    afterNextRender(() => {
      const quote = this.quote();
      if (quote && quotesActions.activeQuoteId() === quote.id) {
        quotesActions.open(quote);
      }
    });
  }

  private date(iso: string | undefined): string {
    return iso ? formatDate(iso, this.lang()) : '';
  }
}
