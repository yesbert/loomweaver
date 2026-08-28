import { Component, CUSTOM_ELEMENTS_SCHEMA, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { type MarginLine, formatMoney, marginOf } from '../../../../accounting';
import { activeLang, quoteFromRoute } from './quote-context';

export interface MarginRow {
  readonly lineId: string;
  readonly descriptionKey: string;
  readonly margin: string;
  readonly percent: number;
  readonly thin: boolean;
}

const THIN_MARGIN_PERCENT = 40;

@Component({
  selector: 'lw-quotes-margin-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './quotes-margin-view.html',
})
export class QuotesMarginView {
  private readonly lang = activeLang();

  protected readonly quote = quoteFromRoute();

  private readonly totals = computed(() => {
    const quote = this.quote();
    return quote ? marginOf(quote.lines) : undefined;
  });

  protected readonly revenue = computed(() => this.money(this.totals()?.revenue));
  protected readonly cost = computed(() => this.money(this.totals()?.cost));
  protected readonly margin = computed(() => this.money(this.totals()?.margin));
  protected readonly percent = computed(() => this.totals()?.percent ?? 0);

  protected readonly rows = computed<readonly MarginRow[]>(
    () => this.totals()?.lines.map((line) => this.row(line)) ?? [],
  );

  private row(line: MarginLine): MarginRow {
    return {
      lineId: line.lineId,
      descriptionKey: `accounting.${line.descriptionKey}`,
      margin: formatMoney(line.margin, this.lang()),
      percent: line.percent,
      thin: line.percent < THIN_MARGIN_PERCENT,
    };
  }

  private money(cents: number | undefined): string {
    return cents === undefined ? '' : formatMoney(cents, this.lang());
  }
}
