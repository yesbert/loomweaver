import { type PluginContext } from '@loomweaver/plugin-sdk';
import { overdueReceivables, startDunningRun } from './books';

let ctx: PluginContext | undefined;

export const financeActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
  },
  async dunningRun(): Promise<number> {
    const host = ctx;
    if (!host) {
      return 0;
    }
    const due = overdueReceivables().length;
    if (due === 0) {
      host.ui.toast({ message: 'product.finance.nothingOverdue', kind: 'info', timeoutMs: 3000 });
      return 0;
    }
    const go = await host.ui.confirm({
      title: 'product.finance.startDunning',
      message: 'product.finance.confirmDunning',
      confirmLabel: 'product.finance.startDunning',
      tone: 'warning',
    });
    if (!go) {
      return 0;
    }
    const reminded = startDunningRun();
    host.ui.toast({ message: 'product.finance.dunningDone', kind: 'success', timeoutMs: 4000 });
    return reminded;
  },
};
