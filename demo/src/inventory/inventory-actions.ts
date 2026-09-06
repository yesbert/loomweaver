import { type PluginContext } from '@loomweaver/plugin-sdk';
import { countStock, itemByNumber } from './stock';

let ctx: PluginContext | undefined;

export const inventoryActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
  },
  async countStock(): Promise<string | null> {
    const host = ctx;
    if (!host) {
      return null;
    }
    const number = await host.ui.prompt({
      title: 'product.inventory.countStock',
      message: 'product.inventory.count.whichItem',
      placeholder: 'product.inventory.count.itemPlaceholder',
      confirmLabel: 'product.inventory.count.confirm',
    });
    if (!number?.trim()) {
      return null;
    }
    const item = itemByNumber(number);
    if (!item) {
      host.ui.toast({
        message: 'product.inventory.count.unknownItem',
        kind: 'warning',
        timeoutMs: 4000,
      });
      return null;
    }
    const counted = await host.ui.prompt({
      title: 'product.inventory.countStock',
      message: 'product.inventory.count.howMany',
      initial: String(item.onHand),
      confirmLabel: 'product.inventory.count.confirm',
    });
    const quantity = Number(counted?.trim());
    if (counted === null || !Number.isInteger(quantity) || quantity < 0) {
      return null;
    }
    if (countStock(item.id, quantity) === null) {
      host.ui.toast({
        message: 'product.inventory.count.unchanged',
        kind: 'info',
        timeoutMs: 3000,
      });
      return null;
    }
    host.ui.toast({
      message: 'product.inventory.count.done',
      kind: 'success',
      timeoutMs: 4000,
    });
    return item.number;
  },
};
