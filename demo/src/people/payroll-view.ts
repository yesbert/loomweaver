import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { payrollRuns } from './staff';
import { language, moneyIn, monthIn } from './people-view-model';
import { peopleActions } from './people-actions';

@Component({
  selector: 'lw-payroll-view',
  imports: [TranslocoPipe],
  templateUrl: './payroll-view.html',
})
export class PayrollView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    const money = moneyIn(() => this.lang());
    const month = monthIn(() => this.lang());
    return payrollRuns().map((run) => ({
      run,
      month: month(run.month),
      gross: money(run.gross),
    }));
  });

  protected run(): void {
    void peopleActions.runPayroll();
  }
}
