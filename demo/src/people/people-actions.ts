import { pluginContextHolder } from '../plugin-context';
import { openRun, payOpenRun } from './staff';

const context = pluginContextHolder();

export const peopleActions = {
  bind: context.bind,
  unbind: context.unbind,
  async runPayroll(): Promise<string | null> {
    const host = context.current;
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
