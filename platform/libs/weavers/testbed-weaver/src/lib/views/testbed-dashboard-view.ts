import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { map } from 'rxjs';
import { ENTRIES, Entry } from './testbed-entries';
import { formatWaiting } from './testbed-list-view';

export interface Kpi {
  readonly id: string;
  readonly value: string;
  readonly deltaKey: string;
  readonly delta: string;
  readonly good: boolean;
}

export interface StatusBar {
  readonly id: string;
  readonly count: number;
  readonly percent: number;
  readonly tone: string;
}

export interface DayPoint {
  readonly day: string;
  readonly count: number;
}

const VOLUME: readonly DayPoint[] = [
  { day: 'Mon', count: 14 },
  { day: 'Tue', count: 11 },
  { day: 'Wed', count: 18 },
  { day: 'Thu', count: 9 },
  { day: 'Fri', count: 16 },
  { day: 'Sat', count: 4 },
  { day: 'Sun', count: 6 },
];

const REPLY_MINUTES: readonly DayPoint[] = [
  { day: 'Mon', count: 22 },
  { day: 'Tue', count: 18 },
  { day: 'Wed', count: 31 },
  { day: 'Thu', count: 15 },
  { day: 'Fri', count: 12 },
  { day: 'Sat', count: 9 },
  { day: 'Sun', count: 14 },
];

const CHART = { width: 320, height: 96, pad: 6 } as const;

export function linePoints(
  values: readonly number[],
  width = CHART.width,
  height = CHART.height,
  pad = CHART.pad,
): string {
  if (values.length < 2) {
    return '';
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const step = (width - pad * 2) / (values.length - 1);
  return values
    .map((value, index) => {
      const x = pad + index * step;
      const y = height - pad - ((value - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function areaPath(
  values: readonly number[],
  width = CHART.width,
  height = CHART.height,
  pad = CHART.pad,
): string {
  const points = linePoints(values, width, height, pad);
  if (points === '') {
    return '';
  }
  return `M ${pad},${height} L ${points.replaceAll(' ', ' L ')} L ${width - pad},${height} Z`;
}

@Component({
  selector: 'lw-testbed-dashboard-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './testbed-dashboard-view.html',
})
export class TestbedDashboardView {
  private readonly route = inject(ActivatedRoute);

  protected readonly section = toSignal(
    this.route.url.pipe(
      map((segments) => segments[segments.length - 1]?.path ?? 'overview'),
    ),
    { initialValue: 'overview' },
  );

  private readonly unresolved = ENTRIES.filter(
    (entry) => entry.status !== 'resolved',
  );

  protected readonly kpis: readonly Kpi[] = [
    {
      id: 'waiting',
      value: String(this.unresolved.length),
      deltaKey: 'testbed.dash.kpi.vsYesterday',
      delta: '+2',
      good: false,
    },
    {
      id: 'urgent',
      value: String(
        ENTRIES.filter((entry) => entry.priority === 'urgent').length,
      ),
      deltaKey: 'testbed.dash.kpi.vsYesterday',
      delta: '−1',
      good: true,
    },
    {
      id: 'firstReply',
      value: '14m',
      deltaKey: 'testbed.dash.kpi.target',
      delta: '30m',
      good: true,
    },
    {
      id: 'resolved',
      value: String(
        ENTRIES.filter((entry) => entry.status === 'resolved').length,
      ),
      deltaKey: 'testbed.dash.kpi.vsYesterday',
      delta: '+1',
      good: true,
    },
  ];

  protected readonly statusBars: readonly StatusBar[] = (
    [
      ['open', 'bg-brand'],
      ['waiting', 'bg-caution'],
      ['resolved', 'bg-positive'],
    ] as const
  ).map(([status, tone]) => {
    const count = ENTRIES.filter((entry) => entry.status === status).length;
    return {
      id: status,
      count,
      percent: Math.round((count / ENTRIES.length) * 100),
      tone,
    };
  });

  protected readonly longestWaiting: readonly Entry[] = [...this.unresolved]
    .toSorted((a, b) => b.waitingMinutes - a.waitingMinutes)
    .slice(0, 3);

  protected readonly volume = VOLUME;
  protected readonly replyMinutes = REPLY_MINUTES;
  protected readonly chart = CHART;

  protected readonly volumeLine = computed(() =>
    linePoints(VOLUME.map((point) => point.count)),
  );
  protected readonly volumeArea = computed(() =>
    areaPath(VOLUME.map((point) => point.count)),
  );

  private readonly replyMax = Math.max(
    ...REPLY_MINUTES.map((point) => point.count),
  );

  protected barHeight(count: number): number {
    return Math.round((count / this.replyMax) * 100);
  }

  protected waiting(entry: Entry): string {
    return formatWaiting(entry.waitingMinutes);
  }
}
