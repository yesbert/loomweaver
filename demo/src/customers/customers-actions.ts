import { pluginContextHolder } from '../plugin-context';
import { addCustomer } from '../accounting';

const context = pluginContextHolder();

export const customersActions = {
  bind: context.bind,
  unbind: context.unbind,
  async create(): Promise<string | null> {
    const host = context.current;
    if (!host) {
      return null;
    }
    const name = await host.ui.prompt({
      title: 'customers.create.title',
      message: 'customers.create.nameMessage',
      placeholder: 'customers.create.namePlaceholder',
      confirmLabel: 'customers.create.confirm',
    });
    if (!name?.trim()) {
      return null;
    }
    const city = await host.ui.prompt({
      title: 'customers.create.title',
      message: 'customers.create.cityMessage',
      placeholder: 'customers.create.cityPlaceholder',
      confirmLabel: 'customers.create.confirm',
    });
    if (city === null) {
      return null;
    }
    const created = addCustomer({ name: name.trim(), city: city.trim() });
    host.ui.toast({
      message: 'customers.create.done',
      kind: 'success',
      timeoutMs: 4000,
    });
    return created.id;
  },
};
