import { type PluginContext } from '@loomweaver/plugin-sdk';
import { nextDelivery, receiveOrder } from './purchasing';

let ctx: PluginContext | undefined;

export const procurementActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
  },
  async receiveGoods(): Promise<string | null> {
    const due = nextDelivery();
    if (!due) {
      ctx?.ui.toast({
        message: 'product.procurement.nothingExpected',
        kind: 'info',
        timeoutMs: 3000,
      });
      return null;
    }
    const go = await ctx?.ui.confirm({
      title: 'product.procurement.receiveGoods',
      message: 'product.procurement.confirmReceipt',
      confirmLabel: 'product.procurement.receiveGoods',
      tone: 'default',
    });
    if (go === false) {
      return null;
    }
    if (!receiveOrder(due.id)) {
      return null;
    }
    ctx?.ui.toast({
      message: 'product.procurement.receiptDone',
      kind: 'success',
      timeoutMs: 4000,
    });
    return due.number;
  },
};
