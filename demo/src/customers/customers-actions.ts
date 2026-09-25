import { type PluginContext } from '@loomweaver/plugin-sdk';
import { addCustomer } from '../accounting';

let ctx: PluginContext | undefined;

export const customersActions = {
  bind(next: PluginContext): void {
    ctx = next;
  },
  unbind(): void {
    ctx = undefined;
  },
  async create(): Promise<string | null> {
    const host = ctx;
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
