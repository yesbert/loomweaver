import { computed, signal } from '@angular/core';
import { type Cents, isoDaysFromToday, today } from '../accounting';

export type PurchaseOrderStatus = 'ordered' | 'confirmed' | 'received';

export interface Supplier {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly city: string;
  readonly leadTimeDays: number;
}

export interface PurchaseOrder {
  readonly id: string;
  readonly number: string;
  readonly supplierId: string;
  readonly orderedOn: string;
  readonly expectedOn: string;
  readonly net: Cents;
  readonly status: PurchaseOrderStatus;
}

interface PurchaseOrderSeed {
  readonly id: string;
  readonly number: string;
  readonly supplierId: string;
  readonly orderedDaysAgo: number;
  readonly leadDays: number;
  readonly net: Cents;
  readonly status: PurchaseOrderStatus;
}

export const SUPPLIERS: readonly Supplier[] = [
  { id: 's-elbe', number: 'L-2001', name: 'Papierwerk Elbe GmbH', city: 'Hamburg', leadTimeDays: 5 },
  { id: 's-rechenzentrum', number: 'L-2002', name: 'Rechenzentrum Nord AG', city: 'Bremen', leadTimeDays: 14 },
  { id: 's-kontorhaus', number: 'L-2003', name: 'Kontorhaus Verwaltung', city: 'Hamburg', leadTimeDays: 30 },
  { id: 's-mohnfeld', number: 'L-2004', name: 'Mohnfeld Bürotechnik GmbH', city: 'Kassel', leadTimeDays: 7 },
  { id: 's-taler', number: 'L-2005', name: 'Taler Metallbau KG', city: 'Solingen', leadTimeDays: 21 },
  { id: 's-lindgruen', number: 'L-2006', name: 'Lindgrün Catering', city: 'Köln', leadTimeDays: 3 },
];

const ORDER_SEEDS: readonly PurchaseOrderSeed[] = [
  { id: 'o-1', number: 'BE-4310', supplierId: 's-elbe', orderedDaysAgo: 18, leadDays: 5, net: 214_800, status: 'received' },
  { id: 'o-2', number: 'BE-4311', supplierId: 's-mohnfeld', orderedDaysAgo: 12, leadDays: 7, net: 486_900, status: 'confirmed' },
  { id: 'o-3', number: 'BE-4312', supplierId: 's-rechenzentrum', orderedDaysAgo: 9, leadDays: 14, net: 1_290_000, status: 'confirmed' },
  { id: 'o-4', number: 'BE-4313', supplierId: 's-taler', orderedDaysAgo: 6, leadDays: 21, net: 742_500, status: 'ordered' },
  { id: 'o-5', number: 'BE-4314', supplierId: 's-lindgruen', orderedDaysAgo: 4, leadDays: 3, net: 68_400, status: 'received' },
  { id: 'o-6', number: 'BE-4315', supplierId: 's-kontorhaus', orderedDaysAgo: 2, leadDays: 30, net: 325_000, status: 'ordered' },
  { id: 'o-7', number: 'BE-4316', supplierId: 's-elbe', orderedDaysAgo: 1, leadDays: 5, net: 152_300, status: 'ordered' },
];

function seededOrders(): readonly PurchaseOrder[] {
  return ORDER_SEEDS.map((seed) => ({
    id: seed.id,
    number: seed.number,
    supplierId: seed.supplierId,
    orderedOn: isoDaysFromToday(-seed.orderedDaysAgo),
    expectedOn: isoDaysFromToday(seed.leadDays - seed.orderedDaysAgo),
    net: seed.net,
    status: seed.status,
  }));
}

const orderStore = signal<readonly PurchaseOrder[]>(seededOrders());

export const purchaseOrders = orderStore.asReadonly();

export function resetPurchasing(): void {
  orderStore.set(seededOrders());
}

export function supplierById(id: string): Supplier | undefined {
  return SUPPLIERS.find((supplier) => supplier.id === id);
}

export function daysLate(expectedOn: string): number {
  const expected = new Date(expectedOn).getTime();
  return Math.floor((today().getTime() - expected) / 86_400_000);
}

export const openOrders = computed(() =>
  purchaseOrders().filter((order) => order.status !== 'received'),
);

export const lateOrders = computed(() =>
  openOrders().filter((order) => daysLate(order.expectedOn) > 0),
);

export const openOrderValue = computed(() =>
  openOrders().reduce((sum, order) => sum + order.net, 0),
);

export const nextDelivery = computed<PurchaseOrder | null>(() => {
  const [earliest] = [...openOrders()].sort((a, b) => a.expectedOn.localeCompare(b.expectedOn));
  return earliest ?? null;
});

export const openOrdersBySupplier = computed(() => {
  const counted = new Map<string, number>();
  for (const order of openOrders()) {
    counted.set(order.supplierId, (counted.get(order.supplierId) ?? 0) + 1);
  }
  return counted;
});

export function receiveOrder(id: string): boolean {
  const order = purchaseOrders().find((entry) => entry.id === id);
  if (!order || order.status === 'received') {
    return false;
  }
  orderStore.update((all) =>
    all.map((entry) => (entry.id === id ? { ...entry, status: 'received' as const } : entry)),
  );
  return true;
}
