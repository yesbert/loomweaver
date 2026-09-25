import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  type DocumentLine,
  type TaxBucket,
  articleById,
  formatMoney,
  formatQuantity,
  lineNet,
  quoteTotals,
} from '../../accounting';
import { activeLanguage } from '../../i18n/active-language';
import { quoteFromRoute } from './quote-from-route';

interface DocumentLineRow {
  readonly position: number;
  readonly descriptionKey: string;
  readonly articleNumber: string;
  readonly quantity: string;
  readonly unitKey: string;
  readonly unitPrice: string;
  readonly discountPercent?: number;
  readonly net: string;
}

interface TaxBucketRow {
  readonly rate: number;
  readonly net: string;
  readonly tax: string;
}

@Component({
  selector: 'demo-quotes-positions-view',
  imports: [TranslocoPipe],
  templateUrl: './quotes-positions-view.html',
})
export class QuotesPositionsView {
  private readonly lang = activeLanguage();

  protected readonly quote = quoteFromRoute();

  protected readonly lines = computed<readonly DocumentLineRow[]>(() =>
    (this.quote()?.lines ?? []).map((line, index) => this.row(line, index)),
  );

  protected readonly buckets = computed<readonly TaxBucketRow[]>(() => {
    const quote = this.quote();
    return quote
      ? quoteTotals(quote).buckets.map((bucket) => this.bucket(bucket))
      : [];
  });

  protected readonly net = computed(() => this.money(this.totals()?.net));
  protected readonly gross = computed(() => this.money(this.totals()?.gross));

  private totals() {
    const quote = this.quote();
    return quote ? quoteTotals(quote) : undefined;
  }

  private row(line: DocumentLine, index: number): DocumentLineRow {
    const lang = this.lang();
    return {
      position: index + 1,
      descriptionKey: line.descriptionKey,
      articleNumber:
        (line.articleId ? articleById(line.articleId)?.number : '') ?? '',
      quantity: formatQuantity(line.quantity, lang),
      unitKey: `accounting.unit.${line.unit}`,
      unitPrice: formatMoney(line.unitPrice, lang),
      discountPercent: line.discountPercent,
      net: formatMoney(lineNet(line), lang),
    };
  }

  private bucket(bucket: TaxBucket): TaxBucketRow {
    return {
      rate: bucket.rate,
      net: formatMoney(bucket.net, this.lang()),
      tax: formatMoney(bucket.tax, this.lang()),
    };
  }

  private money(cents: number | undefined): string {
    return cents === undefined ? '' : formatMoney(cents, this.lang());
  }
}
