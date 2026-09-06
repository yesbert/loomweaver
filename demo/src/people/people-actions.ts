import { type PluginContext } from '@loomweaver/plugin-sdk';
import { openRun, runPayroll } from './staff';

let ctx: PluginContext | undefined;

export const peopleActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
  },
  async runPayroll(): Promise<string | null> {
    const due = openRun();
    if (!due) {
      ctx?.ui.toast({
        message: 'product.people.nothingOpen',
        kind: 'info',
        timeoutMs: 3000,
      });
      return null;
    }
    const go = await ctx?.ui.confirm({
      title: 'product.people.runPayroll',
      message: 'product.people.confirmPayroll',
      confirmLabel: 'product.people.runPayroll',
      tone: 'warning',
    });
    if (go === false) {
      return null;
    }
    const paid = runPayroll();
    if (!paid) {
      return null;
    }
    ctx?.ui.toast({
      message: 'product.people.payrollDone',
      kind: 'success',
      timeoutMs: 4000,
    });
    return paid.month;
  },
};
