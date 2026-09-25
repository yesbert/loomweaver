import { type PluginContext } from '@loomweaver/plugin-sdk';
import { customers, resetCustomers } from '../accounting';
import { customersActions } from './customers-actions';

function answering(...answers: (string | null)[]): PluginContext {
  const prompt = vi.fn();
  for (const answer of answers) {
    prompt.mockResolvedValueOnce(answer);
  }
  return { ui: { prompt, toast: vi.fn() } } as unknown as PluginContext;
}

describe('creating a customer', () => {
  afterEach(() => {
    customersActions.unbind();
    resetCustomers();
  });

  it('creates nothing when the second question is cancelled', async () => {
    const before = customers().length;
    customersActions.bind(answering('Acme', null));

    expect(await customersActions.create()).toBeNull();
    expect(customers()).toHaveLength(before);
  });

  it('creates the customer without a city when the city is left empty', async () => {
    customersActions.bind(answering('Acme', ''));

    const id = await customersActions.create();

    expect(customers().find((customer) => customer.id === id)).toMatchObject({
      name: 'Acme',
      city: '',
    });
  });
});
