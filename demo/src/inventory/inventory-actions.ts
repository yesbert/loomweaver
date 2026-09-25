import { type PluginContext } from '@loomweaver/plugin-sdk';
import { bookCount, itemByNumber } from './stock';

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
      title: 'inventory.countStock',
      message: 'inventory.count.whichItem',
      placeholder: 'inventory.count.itemPlaceholder',
      confirmLabel: 'inventory.count.confirm',
    });
    if (!number?.trim()) {
      return null;
    }
    const item = itemByNumber(number);
    if (!item) {
      host.ui.toast({
        message: 'inventory.count.unknownItem',
        kind: 'warning',
        timeoutMs: 4000,
      });
      return null;
    }
    const counted = await host.ui.prompt({
      title: 'inventory.countStock',
      message: 'inventory.count.howMany',
      initial: String(item.onHand),
      confirmLabel: 'inventory.count.confirm',
    });
    const quantity = Number(counted?.trim());
    if (counted === null || !Number.isInteger(quantity) || quantity < 0) {
      return null;
    }
    if (bookCount(item.id, quantity) === null) {
      host.ui.toast({
        message: 'inventory.count.unchanged',
        kind: 'info',
        timeoutMs: 3000,
      });
      return null;
    }
    host.ui.toast({
      message: 'inventory.count.done',
      kind: 'success',
      timeoutMs: 4000,
    });
    return item.number;
  },
};
