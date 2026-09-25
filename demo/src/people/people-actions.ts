import { type PluginContext } from '@loomweaver/plugin-sdk';
import { openRun, payOpenRun } from './staff';

let ctx: PluginContext | undefined;

export const peopleActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
  },
  async runPayroll(): Promise<string | null> {
    const host = ctx;
    if (!host) {
      return null;
    }
    const due = openRun();
    if (!due) {
      host.ui.toast({
        message: 'people.nothingOpen',
        kind: 'info',
        timeoutMs: 3000,
      });
      return null;
    }
    const go = await host.ui.confirm({
      title: 'people.runPayroll',
      message: 'people.confirmPayroll',
      confirmLabel: 'people.runPayroll',
      tone: 'warning',
    });
    if (!go) {
      return null;
    }
    const paid = payOpenRun();
    if (!paid) {
      return null;
    }
    host.ui.toast({
      message: 'people.payrollDone',
      kind: 'success',
      timeoutMs: 4000,
    });
    return paid.month;
  },
};
