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
      title: 'product.view.employees',
      icon: 'employees',
      routable: { path: 'people/employees' },
      docks: [],
      padded: false,
      component: EmployeesView,
    });
    ctx.registerSurface({
      id: 'people.payroll',
      title: 'product.view.payrollRuns',
      icon: 'payrollRuns',
      routable: { path: 'people/payroll' },
      docks: [],
      padded: false,
      component: PayrollView,
    });

    ctx.registerCommand({
      id: 'people.runPayroll',
      title: 'product.people.runPayroll',
      description: 'product.people.payrollDescription',
      icon: 'payrollRuns',
      callable: true,
      answers: 'product.people.payrollAnswers',
      run: async () => ({ paid: await peopleActions.runPayroll() }),
    });
  },
  deactivate() {
    peopleActions.unbind();
  },
};
