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
      title: 'product.customers.create.title',
      message: 'product.customers.create.nameMessage',
      placeholder: 'product.customers.create.namePlaceholder',
      confirmLabel: 'product.customers.create.confirm',
    });
    if (!name?.trim()) {
      return null;
    }
    const city = await host.ui.prompt({
      title: 'product.customers.create.title',
      message: 'product.customers.create.cityMessage',
      placeholder: 'product.customers.create.cityPlaceholder',
      confirmLabel: 'product.customers.create.confirm',
    });
    const created = addCustomer({ name: name.trim(), city: city?.trim() ?? '' });
    host.ui.toast({
      message: 'product.customers.create.done',
      kind: 'success',
      timeoutMs: 4000,
    });
    return created.id;
  },
};
