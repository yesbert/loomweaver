import { Plugin } from '@loomweaver/plugin-sdk';
import { ContactHistoryView } from './contact-history-view';
import { CustomerListView } from './customer-list-view';
import { customersActions } from './customers-actions';

export const customersPlugin: Plugin = {
  manifest: {
    id: 'customers',
    name: 'Customers',
    capabilities: ['contributions', 'navigation', 'ui'],
  },
  activate(ctx) {
    customersActions.bind(ctx);

    ctx.registerSurface({
      id: 'customers.list',
      title: 'customers.view.customerList',
      icon: 'sales',
      routable: { path: 'sales/customers' },
      docks: [],
      component: CustomerListView,
    });

    ctx.registerSurface({
      id: 'customers.contacts',
      title: 'customers.view.contactHistory',
      icon: 'sales',
      routable: { path: 'sales/contacts' },
      docks: [],
      component: ContactHistoryView,
    });

    ctx.registerCommand({
      id: 'customers.create',
      title: 'customers.create.action',
      description: 'customers.create.description',
      icon: 'sales',
      callable: true,
      answers: 'customers.create.answers',
      run: async () => {
        const id = await customersActions.create();
        return { created: id ?? null };
      },
    });
  },
  deactivate() {
    customersActions.unbind();
  },
};
