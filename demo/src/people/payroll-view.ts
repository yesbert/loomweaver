import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { payrollRuns } from './staff';
import { peopleActions } from './people-actions';
import { formatMoney, formatMonth } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'lw-payroll-view',
  imports: [TranslocoPipe],
  templateUrl: './payroll-view.html',
})
export class PayrollView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return payrollRuns().map((run) => ({
      run,
      month: formatMonth(run.month, lang),
      gross: formatMoney(run.gross, lang),
    }));
  });

  protected run(): void {
    void peopleActions.runPayroll();
  }
}
