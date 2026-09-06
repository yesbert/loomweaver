import { computed, signal } from '@angular/core';
import { isoDaysFromToday } from '../accounting';

export type StockUnit = 'piece' | 'roll' | 'pack';

export type MovementKind = 'receipt' | 'issue' | 'transfer' | 'count';

export interface StockItem {
  readonly id: string;
  readonly number: string;
  readonly labelKey: string;
  readonly unit: StockUnit;
  readonly location: string;
  readonly onHand: number;
  readonly reorderPoint: number;
}

export interface Movement {
  readonly id: string;
  readonly itemId: string;
  readonly kind: MovementKind;
  readonly quantity: number;
  readonly bookedOn: string;
  readonly reference: string;
}

interface MovementSeed {
  readonly id: string;
  readonly itemId: string;
  readonly kind: MovementKind;
  readonly quantity: number;
  readonly daysAgo: number;
  readonly reference: string;
}

const ITEM_SEEDS: readonly StockItem[] = [
  { id: 'i-carton', number: 'W-410', labelKey: 'product.inventory.item.carton', unit: 'piece', location: 'A-01', onHand: 420, reorderPoint: 150 },
  { id: 'i-wrap', number: 'W-420', labelKey: 'product.inventory.item.wrap', unit: 'roll', location: 'A-02', onHand: 12, reorderPoint: 20 },
  { id: 'i-handbook', number: 'W-300', labelKey: 'product.inventory.item.handbook', unit: 'piece', location: 'B-04', onHand: 86, reorderPoint: 40 },
  { id: 'i-label', number: 'W-430', labelKey: 'product.inventory.item.label', unit: 'pack', location: 'A-03', onHand: 7, reorderPoint: 10 },
  { id: 'i-headset', number: 'W-510', labelKey: 'product.inventory.item.headset', unit: 'piece', location: 'C-11', onHand: 24, reorderPoint: 8 },
  { id: 'i-dock', number: 'W-520', labelKey: 'product.inventory.item.dock', unit: 'piece', location: 'C-12', onHand: 3, reorderPoint: 6 },
];

const MOVEMENT_SEEDS: readonly MovementSeed[] = [
  { id: 'm-1', itemId: 'i-carton', kind: 'receipt', quantity: 500, daysAgo: 18, reference: 'BE-4310' },
  { id: 'm-2', itemId: 'i-carton', kind: 'issue', quantity: -80, daysAgo: 11, reference: 'LS-7712' },
  { id: 'm-3', itemId: 'i-handbook', kind: 'issue', quantity: -14, daysAgo: 9, reference: 'LS-7718' },
  { id: 'm-4', itemId: 'i-headset', kind: 'receipt', quantity: 30, daysAgo: 7, reference: 'BE-4311' },
  { id: 'm-5', itemId: 'i-headset', kind: 'transfer', quantity: -6, daysAgo: 5, reference: 'UM-0042' },
  { id: 'm-6', itemId: 'i-wrap', kind: 'issue', quantity: -18, daysAgo: 4, reference: 'LS-7724' },
  { id: 'm-7', itemId: 'i-dock', kind: 'issue', quantity: -9, daysAgo: 2, reference: 'LS-7731' },
  { id: 'm-8', itemId: 'i-label', kind: 'count', quantity: -3, daysAgo: 1, reference: 'INV-2026-03' },
];

function seededItems(): readonly StockItem[] {
  return ITEM_SEEDS.map((item) => ({ ...item }));
}

function seededMovements(): readonly Movement[] {
  const booked: Movement[] = MOVEMENT_SEEDS.map((seed) => ({
    id: seed.id,
    itemId: seed.itemId,
    kind: seed.kind,
    quantity: seed.quantity,
    bookedOn: isoDaysFromToday(-seed.daysAgo),
    reference: seed.reference,
  }));
  return booked.sort((a, b) => b.bookedOn.localeCompare(a.bookedOn));
}

const itemStore = signal<readonly StockItem[]>(seededItems());
const movementStore = signal<readonly Movement[]>(seededMovements());

export const stockItems = itemStore.asReadonly();
export const movements = movementStore.asReadonly();

export function resetStock(): void {
  itemStore.set(seededItems());
  movementStore.set(seededMovements());
}

export function itemByNumber(number: string): StockItem | undefined {
  const wanted = number.trim().toUpperCase();
  return stockItems().find((item) => item.number.toUpperCase() === wanted);
}

export function itemById(id: string): StockItem | undefined {
  return stockItems().find((item) => item.id === id);
}

export function isBelowReorderPoint(item: StockItem): boolean {
  return item.onHand < item.reorderPoint;
}

export const itemsBelowReorderPoint = computed(() =>
  stockItems().filter(isBelowReorderPoint),
);

export const countedValue = computed(() =>
  stockItems().reduce((sum, item) => sum + item.onHand, 0),
);

export function countStock(itemId: string, counted: number): Movement | null {
  const item = itemById(itemId);
  if (!item || counted < 0 || counted === item.onHand) {
    return null;
  }
  const difference = counted - item.onHand;
  const booked: Movement = {
    id: `m-${Date.now()}`,
    itemId,
    kind: 'count',
    quantity: difference,
    bookedOn: isoDaysFromToday(0),
    reference: `INV-${isoDaysFromToday(0)}`,
  };
  itemStore.update((all) =>
    all.map((entry) =>
      entry.id === itemId ? { ...entry, onHand: counted } : entry,
    ),
  );
  movementStore.update((all) => [booked, ...all]);
  return booked;
}
