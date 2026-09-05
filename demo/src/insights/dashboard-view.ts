import { Component, CUSTOM_ELEMENTS_SCHEMA, computed } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChartConfiguration } from 'chart.js';
import { inject } from '@angular/core';
import {
  type QuoteStatus,
  formatMoney,
  localeOf,
  marginOf,
  openQuoteValue,
  quoteTotals,
  quotes,
  today,
} from '../accounting';
import { demoSession } from '../session/session';
import { activeLang } from './insights-context';
import { chartColours } from './chart-tokens';
import { InsightsChart } from './insights-chart';

const STATUS_ORDER: readonly QuoteStatus[] = [
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
];

const MONTHS_SHOWN = 6;
export interface StatusShare {
  readonly status: QuoteStatus;
  readonly count: number;
  readonly colour: string;
}

@Component({
  selector: 'lw-insights-dashboard-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe, InsightsChart],
  templateUrl: './dashboard-view.html',
})
export class InsightsDashboardView {
  private readonly lang = activeLang();
  private readonly colours = chartColours();
  private readonly transloco = inject(TranslocoService);

  protected readonly out = computed(() =>
    formatMoney(openQuoteValue(), this.lang()),
  );

  protected readonly outCount = computed(
    () => quotes().filter((quote) => quote.status === 'sent').length,
  );

  protected readonly total = computed(() => quotes().length);

  protected readonly acceptRate = computed(() => {
    const decided = quotes().filter((quote) =>
      ['accepted', 'declined'].includes(quote.status),
    );
    const won = decided.filter((quote) => quote.status === 'accepted').length;
    return decided.length === 0
      ? 0
      : Math.round((won / decided.length) * 100);
  });

  private readonly wonTotals = computed(() => {
    const accepted = quotes().filter((quote) => quote.status === 'accepted');
    return accepted.reduce(
      (sum, quote) => {
        const margin = marginOf(quote.lines);
        return {
          revenue: sum.revenue + margin.revenue,
          margin: sum.margin + margin.margin,
          count: sum.count + 1,
        };
      },
      { revenue: 0, margin: 0, count: 0 },
    );
  });

  protected readonly maySeeMargin = computed(() =>
    demoSession.snapshot().roles.includes('accounting'),
  );

  protected readonly wonMargin = computed(() =>
    formatMoney(this.wonTotals().margin, this.lang()),
  );

  protected readonly wonRevenue = computed(() =>
    formatMoney(this.wonTotals().revenue, this.lang()),
  );

  protected readonly wonPercent = computed(() => {
    const { revenue, margin } = this.wonTotals();
    return revenue === 0 ? 0 : Math.round((margin / revenue) * 100);
  });

  protected readonly shares = computed<readonly StatusShare[]>(() => {
    const colours = this.colours();
    const all = quotes();
    const tone: Readonly<Record<QuoteStatus, string>> = {
      draft: colours.muted,
      sent: colours.brand,
      accepted: colours.positive,
      declined: colours.negative,
      expired: colours.caution,
    };
    return STATUS_ORDER.map((status) => ({
      status,
      count: all.filter((quote) => quote.status === status).length,
      colour: tone[status],
    })).filter((share) => share.count > 0);
  });

  protected readonly pipeline = computed<ChartConfiguration>(() => {
    const colours = this.colours();
    const shares = this.shares();
    return {
      type: 'doughnut',
      data: {
        labels: shares.map((share) =>
          this.transloco.translate(`insights.pipeline.status.${share.status}`),
        ),
        datasets: [
          {
            data: shares.map((share) => share.count),
            backgroundColor: shares.map((share) => share.colour),
            borderColor: colours.border,
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { tooltip: { backgroundColor: colours.content } },
      },
    };
  });

  protected readonly quotedPerMonth = computed<ChartConfiguration>(() => {
    const colours = this.colours();
    const months = lastMonths(MONTHS_SHOWN);
    const totals = months.map((month) =>
      quotes()
        .filter((quote) => quote.issuedOn.startsWith(month))
        .reduce((sum, quote) => sum + quoteTotals(quote).gross, 0),
    );
    const formatter = new Intl.DateTimeFormat(localeOf(this.lang()), {
      month: 'short',
    });
    return {
      type: 'bar',
      data: {
        labels: months.map((month) =>
          formatter.format(new Date(`${month}-01T00:00:00`)),
        ),
        datasets: [
          {
            data: totals.map((cents) => cents / 100),
            backgroundColor: colours.brand,
            borderRadius: 4,
            maxBarThickness: 34,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { tooltip: { backgroundColor: colours.content } },
        scales: {
          x: {
            grid: { display: false },
            border: { color: colours.border },
            ticks: { color: colours.muted },
          },
          y: {
            grid: { color: colours.border },
            border: { display: false },
            ticks: { color: colours.muted, maxTicksLimit: 4 },
          },
        },
      },
    };
  });
}

function lastMonths(count: number): readonly string[] {
  const now = today();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}
