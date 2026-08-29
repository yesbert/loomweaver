import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, signal } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { VIEW_STATE, type ViewState } from '@loomweaver/plugin-sdk';
import { ENTRIES, Entry, EntryPriority, EntryStatus } from './testbed-entries';
import { testbedContent } from '../plugin/testbed-content';

type SortKey = 'waiting' | 'priority';

interface ListState {
  readonly sort: SortKey;
}

const PRIORITY_RANK: Readonly<Record<EntryPriority, number>> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const PRIORITY_STRIPE: Readonly<Record<EntryPriority, string>> = {
  urgent: 'bg-negative',
  high: 'bg-caution',
  normal: 'bg-brand',
  low: 'bg-content-faint',
};

const PRIORITY_TEXT: Readonly<Record<EntryPriority, string>> = {
  urgent: 'text-negative',
  high: 'text-caution',
  normal: 'text-brand-text',
  low: 'text-content-faint',
};

const STATUS_BADGE: Readonly<Record<EntryStatus, string>> = {
  open: 'lw-badge lw-badge--brand',
  waiting: 'lw-badge',
  resolved: 'lw-badge lw-badge--success',
};

const STATUS_ICON: Readonly<Record<EntryStatus, string>> = {
  open: 'testbedOpen',
  waiting: 'testbedWaiting',
  resolved: 'testbedResolved',
};

export function formatWaiting(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  if (minutes < 60 * 24) {
    return `${Math.floor(minutes / 60)}h`;
  }
  return `${Math.floor(minutes / (60 * 24))}d`;
}

@Component({
  selector: 'lw-testbed-list-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './testbed-list-view.html',
})
export class TestbedListView {
  private readonly transloco = inject(TranslocoService);
  private readonly state = inject(VIEW_STATE, {
    optional: true,
  }) as ViewState<ListState> | null;
  private readonly localSort = signal<SortKey>('waiting');
  private readonly openIds = testbedContent.openEntryIds;

  protected readonly sortOrder = computed<SortKey>(
    () => this.state?.value()?.sort ?? this.localSort(),
  );

  protected readonly entries = computed<readonly Entry[]>(() => {
    const by = this.sortOrder();
    return [...ENTRIES].toSorted((a, b) =>
      by === 'priority'
        ? PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          a.waitingMinutes - b.waitingMinutes
        : b.waitingMinutes - a.waitingMinutes,
    );
  });

  protected readonly openCount = computed(
    () => ENTRIES.filter((entry) => entry.status !== 'resolved').length,
  );

  protected stripe(entry: Entry): string {
    return PRIORITY_STRIPE[entry.priority];
  }

  protected priorityText(entry: Entry): string {
    return PRIORITY_TEXT[entry.priority];
  }

  protected statusBadge(entry: Entry): string {
    return STATUS_BADGE[entry.status];
  }

  protected statusIcon(entry: Entry): string {
    return STATUS_ICON[entry.status];
  }

  protected waiting(entry: Entry): string {
    return formatWaiting(entry.waitingMinutes);
  }

  protected excerpt(entry: Entry): number {
    return entry.conversation.length;
  }

  protected tooltipFor(entry: Entry): string {
    return `${entry.subject} — ${entry.owner}, ${entry.group}`;
  }

  protected isOpen(entry: Entry): boolean {
    return this.openIds().has(entry.id);
  }

  protected onSort(event: Event): void {
    const value = (event as CustomEvent<{ value: string }>).detail
      .value as SortKey;
    this.localSort.set(value);
    this.state?.set({ ...this.state.value(), sort: value });
  }

  protected preview(entry: Entry): void {
    testbedContent.openEntry(entry, 'preview');
  }

  protected open(entry: Entry): void {
    testbedContent.keepEntry(entry);
  }

  protected rowMenu(event: MouseEvent, entry: Entry): void {
    event.preventDefault();
    testbedContent.openMenu(
      [
        {
          label: this.transloco.translate('testbed.list.ctxOpen'),
          icon: 'testbedEntry',
          run: () => testbedContent.openEntry(entry, 'permanent'),
        },
        {
          label: this.transloco.translate('testbed.list.ctxPreview'),
          icon: 'preview',
          run: () => testbedContent.openEntry(entry, 'preview'),
        },
      ],
      { x: event.clientX, y: event.clientY },
    );
  }
}
