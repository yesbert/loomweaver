import {
  afterNextRender,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  linkedSignal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DirtySurface } from '@loomweaver/plugin-sdk';
import {
  type Customer,
  customerById,
  formatDate,
  quoteNote,
  saveQuoteNote,
} from '../../../../accounting';
import { quotesActions } from '../plugin/quotes-actions';
import { activeLang, quoteFromRoute } from './quote-context';
import { STATUS_BADGE } from './quote-status';

@Component({
  selector: 'lw-quotes-customer-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './quotes-customer-view.html',
})
export class QuotesCustomerView implements DirtySurface {
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

  private readonly savedNote = computed(() => {
    const quote = this.quote();
    return quote ? quoteNote(quote.id) : '';
  });

  protected readonly note = linkedSignal(() => this.savedNote());

  constructor() {
    afterNextRender(() => {
      const quote = this.quote();
      if (quote && quotesActions.activeQuoteId() === quote.id) {
        quotesActions.open(quote);
      }
    });
  }

  surfaceDirty(): boolean {
    return this.note() !== this.savedNote();
  }

  async surfaceSave(): Promise<void> {
    const quote = this.quote();
    if (quote) {
      saveQuoteNote(quote.id, this.note());
    }
  }

  protected onNote(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }

  private date(iso: string | undefined): string {
    return iso ? formatDate(iso, this.lang()) : '';
  }
}
