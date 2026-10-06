import { pluginContextHolder } from '../plugin-context';
import { nextDelivery, receiveOrder } from './purchasing';

const context = pluginContextHolder();

export const procurementActions = {
  bind: context.bind,
  unbind: context.unbind,
  async receiveGoods(): Promise<string | null> {
    const host = context.current;
    if (!host) {
      return null;
    }
    const due = nextDelivery();
    if (!due) {
      host.ui.toast({
        message: 'procurement.nothingExpected',
        kind: 'info',
        timeoutMs: 3000,
      });
      return null;
    }
    const go = await host.ui.confirm({
      title: 'procurement.receiveGoods',
      message: 'procurement.confirmReceipt',
      confirmLabel: 'procurement.receiveGoods',
      tone: 'default',
    });
    if (!go) {
      return null;
    }
    if (!receiveOrder(due.id)) {
      return null;
    }
    host.ui.toast({
      message: 'procurement.receiptDone',
      kind: 'success',
      timeoutMs: 4000,
    });
    return due.number;
  },
};
