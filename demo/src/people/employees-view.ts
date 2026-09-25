import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { employees, headcount, monthlyGross } from './staff';
import { formatDate, formatMoney } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'lw-employees-view',
  imports: [TranslocoPipe],
  templateUrl: './employees-view.html',
})
export class EmployeesView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return employees().map((employee) => ({
      employee,
      joined: formatDate(employee.joinedOn, lang),
      gross: formatMoney(employee.monthlyGross, lang),
      partTime: employee.weeklyHours < 40,
    }));
  });

  protected readonly count = headcount;

  protected readonly payroll = computed(() =>
    formatMoney(monthlyGross(), this.lang()),
  );
}
