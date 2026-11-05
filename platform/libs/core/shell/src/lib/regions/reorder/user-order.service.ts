import { Service } from '@angular/core';
import { persistedWorkingState } from '../../persistence/stored-values/persisted-setting';
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
  private readonly stored = persistedWorkingState(STORAGE_KEY, {
    parse: parseOrders,
    serialize: (orders) => JSON.stringify(orders),
  });
  private readonly orders = this.stored.value;

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
    this.stored.update((state) => ({ ...state, [containerId]: [...ids] }));
  }

  reset(): void {
    this.stored.clear();
  }
}
