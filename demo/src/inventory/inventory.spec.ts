import { setReferenceDate } from '../accounting/clock';
import {
  countStock,
  isBelowReorderPoint,
  itemByNumber,
  itemsBelowReorderPoint,
  movements,
  resetStock,
  stockItems,
} from './stock';

describe('stock', () => {
  beforeEach(() => {
    setReferenceDate(new Date('2026-06-15T12:00:00Z'));
    resetStock();
  });

  afterEach(() => setReferenceDate(null));

  it('calls an item low when it has fallen under its own reorder point', () => {
    const low = itemsBelowReorderPoint().map((item) => item.number);

    expect(low).toContain('W-420');
    expect(low).not.toContain('W-410');
    for (const item of itemsBelowReorderPoint()) {
      expect(item.onHand).toBeLessThan(item.reorderPoint);
    }
  });

  it('finds an item by its number however it was typed', () => {
    expect(itemByNumber('w-410')?.id).toBe('i-carton');
    expect(itemByNumber('  W-410 ')?.id).toBe('i-carton');
    expect(itemByNumber('W-999')).toBeUndefined();
  });

  it('shows the newest movement first', () => {
    const dates = movements().map((movement) => movement.bookedOn);

    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it('books a count as the difference, and moves the item to what was counted', () => {
    const before = itemByNumber('W-410')!;

    const booked = countStock(before.id, 400);

    expect(booked?.quantity).toBe(400 - before.onHand);
    expect(booked?.kind).toBe('count');
    expect(itemByNumber('W-410')?.onHand).toBe(400);
    expect(movements()[0].id).toBe(booked?.id);
  });

  it('books nothing when the count agrees with the books, or makes no sense', () => {
    const item = itemByNumber('W-410')!;
    const before = movements().length;

    expect(countStock(item.id, item.onHand)).toBeNull();
    expect(countStock(item.id, -5)).toBeNull();
    expect(countStock('i-nothing', 10)).toBeNull();
    expect(movements().length).toBe(before);
  });

  it('takes an item below its reorder point once the count says so', () => {
    const item = itemByNumber('W-510')!;

    expect(isBelowReorderPoint(item)).toBe(false);

    countStock(item.id, 2);

    expect(isBelowReorderPoint(itemByNumber('W-510')!)).toBe(true);
    expect(itemsBelowReorderPoint().map((entry) => entry.number)).toContain(
      'W-510',
    );
  });

  it('names every item a movement points at', () => {
    const known = new Set(stockItems().map((item) => item.id));

    for (const movement of movements()) {
      expect(known.has(movement.itemId)).toBe(true);
    }
  });
});
