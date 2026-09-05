import { type PluginContext } from '@loomweaver/plugin-sdk';
import { overdueReceivables, startDunningRun } from '../accounting';

let ctx: PluginContext | undefined;

export const financeActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
  },
  async dunningRun(): Promise<number> {
    const due = overdueReceivables().length;
    if (due === 0) {
      ctx?.ui.toast({ message: 'product.finance.nothingOverdue', kind: 'info', timeoutMs: 3000 });
      return 0;
    }
    const go = await ctx?.ui.confirm({
      title: 'product.finance.startDunning',
      message: 'product.finance.confirmDunning',
      confirmLabel: 'product.finance.startDunning',
      tone: 'warning',
    });
    if (go === false) {
      return 0;
    }
    const reminded = startDunningRun();
    ctx?.ui.toast({ message: 'product.finance.dunningDone', kind: 'success', timeoutMs: 4000 });
    return reminded;
  },
};
