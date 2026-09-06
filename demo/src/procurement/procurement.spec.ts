import { setReferenceDate } from '../accounting/clock';
import {
  SUPPLIERS,
  daysLate,
  lateOrders,
  nextDelivery,
  openOrderValue,
  openOrders,
  openOrdersBySupplier,
  purchaseOrders,
  receiveOrder,
  resetPurchasing,
  supplierById,
} from './purchasing';

describe('purchasing', () => {
  beforeEach(() => {
    setReferenceDate(new Date('2026-06-15T12:00:00Z'));
    resetPurchasing();
  });

  afterEach(() => setReferenceDate(null));

  it('counts an order as open until it has been received', () => {
    const received = purchaseOrders().find((order) => order.number === 'BE-4310');

    expect(received!.status).toBe('received');
    expect(openOrders().map((order) => order.number)).not.toContain('BE-4310');
    expect(openOrders().map((order) => order.number)).toContain('BE-4311');
  });

  it('adds up only what is still on order', () => {
    expect(openOrderValue()).toBe(
      openOrders().reduce((sum, order) => sum + order.net, 0),
    );
    expect(openOrderValue()).toBeGreaterThan(0);
  });

  it('calls an open order late once its expected date has passed', () => {
    const late = lateOrders().map((order) => order.number);

    expect(late).toContain('BE-4311');
    expect(late).not.toContain('BE-4313');
    for (const order of lateOrders()) {
      expect(daysLate(order.expectedOn)).toBeGreaterThan(0);
    }
  });

  it('expects the delivery that is due first next', () => {
    const due = nextDelivery();

    expect(due!.number).toBe('BE-4311');
    for (const order of openOrders()) {
      expect(order.expectedOn >= due!.expectedOn).toBe(true);
    }
  });

  it('receives an order once, and leaves the others alone', () => {
    const before = openOrders().length;

    expect(receiveOrder('o-2')).toBe(true);
    expect(receiveOrder('o-2')).toBe(false);
    expect(openOrders().length).toBe(before - 1);
    expect(nextDelivery()!.number).toBe('BE-4316');
  });

  it('reports what each supplier still owes a delivery on', () => {
    const open = openOrdersBySupplier();

    expect(open.get('s-elbe')).toBe(1);
    expect(open.get('s-lindgruen')).toBeUndefined();
    expect([...open.values()].reduce((sum, count) => sum + count, 0)).toBe(
      openOrders().length,
    );
  });

  it('names every supplier an order points at', () => {
    for (const order of purchaseOrders()) {
      expect(supplierById(order.supplierId)).toBeDefined();
    }
    expect(SUPPLIERS.length).toBeGreaterThan(0);
  });
});
