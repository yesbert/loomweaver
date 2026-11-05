import type { PluginContext } from '@loomweaver/plugin-sdk';
import { setReferenceDate } from '../accounting/clock';
import { inventoryActions } from './inventory-actions';
import { itemByNumber, movements, resetStock } from './stock';

function hostAnswering(...answers: (string | null)[]): PluginContext {
  const pending = [...answers];
  return {
    ui: {
      prompt: () => Promise.resolve(pending.shift() ?? null),
      toast: () => undefined,
    },
  } as unknown as PluginContext;
}

describe('inventoryActions', () => {
  beforeEach(() => {
    setReferenceDate(new Date('2026-06-15T12:00:00Z'));
    resetStock();
  });

  afterEach(() => {
    inventoryActions.unbind();
    setReferenceDate(null);
  });

  it('posts nothing when the counted quantity is left empty', async () => {
    const before = itemByNumber('W-410')!.onHand;
    const booked = movements().length;

    for (const empty of ['', '   ']) {
      inventoryActions.bind(hostAnswering('W-410', empty));

      expect(await inventoryActions.countStock()).toBeNull();
    }

    expect(itemByNumber('W-410')?.onHand).toBe(before);
    expect(movements()).toHaveLength(booked);
  });

  it('posts a counted zero, which is a quantity and not an empty answer', async () => {
    inventoryActions.bind(hostAnswering('W-410', '0'));

    expect(await inventoryActions.countStock()).toBe('W-410');
    expect(itemByNumber('W-410')?.onHand).toBe(0);
  });
});
