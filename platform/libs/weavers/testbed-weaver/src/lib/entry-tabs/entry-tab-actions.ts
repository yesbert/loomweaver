import { Signal, signal } from '@angular/core';
import { OpenTabInput } from '@loomweaver/plugin-sdk';
import { testbedContext } from '../bound-context';
import { Entry } from './testbed-entries';

export const ENTRY_LIST_SURFACE = 'testbed.list';

type OpenMode = 'preview' | 'permanent';

class EntryTabActions {
  private readonly openIdSet = signal<ReadonlySet<string>>(new Set());
  private flagged = false;
  readonly openIds: Signal<ReadonlySet<string>> = this.openIdSet.asReadonly();

  openEntry(entry: Entry, mode: OpenMode = 'permanent'): void {
    const input: OpenTabInput = {
      path: `entry/${entry.id}`,
      title: entry.reference,
      icon: 'testbedEntry',
      titleIsLiteral: true,
      onClose: () => this.markClosed(entry.id),
      preview: mode === 'preview',
    };
    this.markOpen(entry.id);
    testbedContext.use((ctx) => ctx.openContentTab(input));
  }

  keepEntry(entry: Entry): void {
    testbedContext.use((ctx) => ctx.keepContentTab(`entry/${entry.id}`));
  }

  toggleFlagOnOpenEntries(): void {
    this.flagged = !this.flagged;
    const badge = this.flagged
      ? ({ text: 'testbed.badge.flagged', tone: 'danger' } as const)
      : null;
    for (const id of this.openIdSet()) {
      testbedContext.use((ctx) =>
        ctx.updateContentTab(`entry/${id}`, { badge }),
      );
    }
  }

  revealList(): void {
    testbedContext.use((ctx) => ctx.revealSurface(ENTRY_LIST_SURFACE));
  }

  reset(): void {
    this.openIdSet.set(new Set());
  }

  private markOpen(id: string): void {
    this.openIdSet.update((ids) => new Set(ids).add(id));
  }

  private markClosed(id: string): void {
    this.openIdSet.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }
}

export const entryTabs = new EntryTabActions();
