import type { PluginContext } from '@loomweaver/plugin-sdk';
import { setReferenceDate } from '../accounting/clock';
import de from './i18n/de.json';
import en from './i18n/en.json';
import { inventoryActions } from './inventory-actions';
import { itemByNumber, movements, resetStock } from './stock';

const said: string[] = [];

function hostAnswering(...answers: (string | null)[]): PluginContext {
  const pending = [...answers];
  return {
    ui: {
      prompt: () => Promise.resolve(pending.shift() ?? null),
      toast: (toast: { message: string }) => said.push(toast.message),
    },
  } as unknown as PluginContext;
}

describe('inventoryActions', () => {
  beforeEach(() => {
    setReferenceDate(new Date('2026-06-15T12:00:00Z'));
    resetStock();
    said.length = 0;
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

  it.each(['0', ' 0 '])('posts a counted zero typed as "%s", which is a quantity and not an empty answer', async (zero) => {
    inventoryActions.bind(hostAnswering('W-410', zero));

    expect(await inventoryActions.countStock()).toBe('W-410');
    expect(itemByNumber('W-410')?.onHand).toBe(0);
  });

  it.each(['abc', '-5', '12,5', '1e3', '1.000', '12.5'])(
    'refuses "%s" as a count, posts nothing and says that a count is a whole number',
    async (typed) => {
      const before = itemByNumber('W-410')!.onHand;
      const booked = movements().length;
      inventoryActions.bind(hostAnswering('W-410', typed));

      expect(await inventoryActions.countStock()).toBeNull();

      expect(itemByNumber('W-410')?.onHand).toBe(before);
      expect(movements()).toHaveLength(booked);
      expect(said).toEqual(['inventory.count.notWholeNumber']);
    },
  );

  it('carries the refusal in both languages', () => {
    expect(en.count).toHaveProperty('notWholeNumber');
    expect(de.count).toHaveProperty('notWholeNumber');
  });
});
