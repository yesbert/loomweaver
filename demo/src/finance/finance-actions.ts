import { pluginContextHolder } from '../plugin-context';
import { overdueReceivables, startDunningRun } from './books';

const context = pluginContextHolder();

export const financeActions = {
  bind: context.bind,
  unbind: context.unbind,
  async dunningRun(): Promise<number> {
    const host = context.current;
    if (!host) {
      return 0;
    }
    const due = overdueReceivables().length;
    if (due === 0) {
      host.ui.toast({ message: 'finance.nothingOverdue', kind: 'info', timeoutMs: 3000 });
      return 0;
    }
    const go = await host.ui.confirm({
      title: 'finance.startDunning',
      message: 'finance.confirmDunning',
      confirmLabel: 'finance.startDunning',
      tone: 'warning',
    });
    if (!go) {
      return 0;
    }
    const reminded = startDunningRun();
    host.ui.toast({ message: 'finance.dunningDone', kind: 'success', timeoutMs: 4000 });
    return reminded;
  },
};
