import { inject, Service, signal } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { hydrateAsync, readStoredValue } from '../../persistence/stored-values/hydrate';
import { StateSyncService } from '../../persistence/cross-tab/state-sync.service';
import { parseStored } from '../../persistence/stored-values/parse-stored';
import { recordOf } from '../../persistence/stored-values/persisted-record';

const STORAGE_KEY = 'lw.shell.item-order';

function isIdList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((id) => typeof id === 'string');
}

function parseOrders(
  raw: string | undefined,
): Record<string, readonly string[]> {
  return recordOf(parseStored(raw), isIdList);
}

@Service()
export class UserOrderService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly orders = signal<Record<string, readonly string[]>>(
    parseOrders(this.store.peek?.(STORAGE_KEY)),
  );

  constructor() {
    const apply = (raw: string | undefined) =>
      this.orders.set(parseOrders(raw));
    hydrateAsync(this.store, STORAGE_KEY, apply);
    this.sync.onNamespaceAdopted(async () =>
      apply(await readStoredValue(this.store, STORAGE_KEY)),
    );
  }

  applyOrder<T>(
    containerId: string,
    items: readonly T[],
    key: (item: T) => string,
  ): T[] {
    const sequence = this.orders()[containerId];
    if (!sequence || sequence.length === 0) {
      return [...items];
    }
    const rank = new Map(sequence.map((id, index) => [id, index]));
    const ranked = (item: T) => rank.has(key(item));

    const knownInUserOrder = items
      .filter((item) => ranked(item))
      .toSorted((a, b) => (rank.get(key(a)) ?? 0) - (rank.get(key(b)) ?? 0));
    let next = 0;
    return items.map((item) =>
      ranked(item) ? knownInUserOrder[next++] : item,
    );
  }

  setOrder(containerId: string, ids: readonly string[]): void {
    this.orders.update((state) => ({ ...state, [containerId]: [...ids] }));
    void this.store.set(STORAGE_KEY, JSON.stringify(this.orders()));
  }

  reset(): void {
    this.orders.set({});
    void this.store.delete(STORAGE_KEY);
  }
}
