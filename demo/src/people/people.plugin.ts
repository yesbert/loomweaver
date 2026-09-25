import { Plugin } from '@loomweaver/plugin-sdk';
import { EmployeesView } from './employees-view';
import { PayrollView } from './payroll-view';
import { peopleActions } from './people-actions';

export const peoplePlugin: Plugin = {
  manifest: {
    id: 'people',
    name: 'People',
    capabilities: ['contributions', 'navigation', 'ui'],
  },
  activate(ctx) {
    peopleActions.bind(ctx);

    ctx.registerSurface({
      id: 'people.employees',
      title: 'people.view.employees',
      icon: 'employees',
      routable: { path: 'people/employees' },
      docks: [],
      component: EmployeesView,
    });
    ctx.registerSurface({
      id: 'people.payroll',
      title: 'people.view.payrollRuns',
      icon: 'payrollRuns',
      routable: { path: 'people/payroll' },
      docks: [],
      component: PayrollView,
    });

    ctx.registerCommand({
      id: 'people.runPayroll',
      title: 'people.runPayroll',
      description: 'people.payrollDescription',
      icon: 'payrollRuns',
      callable: true,
      answers: 'people.payrollAnswers',
      run: async () => ({ paid: await peopleActions.runPayroll() }),
    });
  },
  deactivate() {
    peopleActions.unbind();
  },
};
