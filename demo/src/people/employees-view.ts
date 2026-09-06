import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { employees, headcount, monthlyGross } from './staff';
import { dateIn, language, moneyIn } from './people-view-model';

@Component({
  selector: 'lw-employees-view',
  imports: [TranslocoPipe],
  templateUrl: './employees-view.html',
})
export class EmployeesView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    const money = moneyIn(() => this.lang());
    const date = dateIn(() => this.lang());
    return employees().map((employee) => ({
      employee,
      joined: date(employee.joinedOn),
      gross: money(employee.monthlyGross),
      partTime: employee.weeklyHours < 40,
    }));
  });

  protected readonly count = computed(() => headcount());

  protected readonly payroll = computed(() =>
    moneyIn(() => this.lang())(monthlyGross()),
  );
}
