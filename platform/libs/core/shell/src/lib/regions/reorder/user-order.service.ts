import { inject, Service, signal } from '@angular/core';
import { WORKING_STATE_STORE } from '../../persistence/working-state-store';
import { hydrateAsync } from '../../persistence/hydrate';

const STORAGE_KEY = 'lw.shell.item-order';

function parseOrders(
  raw: string | undefined,
): Record<string, readonly string[]> {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, readonly string[]> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value) && value.every((id) => typeof id === 'string')) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

@Service()
export class UserOrderService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly orders = signal<Record<string, readonly string[]>>(
    parseOrders(this.store.peek?.(STORAGE_KEY)),
  );

  constructor() {
    hydrateAsync(this.store, STORAGE_KEY, (raw) =>
      this.orders.set(parseOrders(raw)),
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
      .filter(ranked)
      .sort((a, b) => (rank.get(key(a)) ?? 0) - (rank.get(key(b)) ?? 0));
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
