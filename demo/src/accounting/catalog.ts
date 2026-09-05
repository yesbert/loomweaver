import { signal } from '@angular/core';
import { Cents } from './money';
import { TaxRate, Unit } from './document';

export interface Customer {
  readonly id: string;
  readonly number: string;
  readonly name: string;
  readonly city: string;
  readonly vatId: string;
  readonly paymentTermsDays: number;
}

export interface Article {
  readonly id: string;
  readonly number: string;
  readonly descriptionKey: string;
  readonly unit: Unit;
  readonly unitPrice: Cents;
  readonly costPrice: Cents;
  readonly taxRate: TaxRate;
}

const CUSTOMER_SEEDS: readonly Customer[] = [
  { id: 'c-nordwind', number: 'K-1001', name: 'Nordwind Logistik GmbH', city: 'Hamburg', vatId: 'DE811502345', paymentTermsDays: 14 },
  { id: 'c-auerbach', number: 'K-1002', name: 'Auerbach & Sohn KG', city: 'Leipzig', vatId: 'DE216740881', paymentTermsDays: 30 },
  { id: 'c-vitalis', number: 'K-1003', name: 'Vitalis Praxisbedarf GmbH', city: 'Freiburg', vatId: 'DE145908772', paymentTermsDays: 14 },
  { id: 'c-steinweg', number: 'K-1004', name: 'Steinweg Architekten PartG', city: 'Münster', vatId: 'DE330119654', paymentTermsDays: 21 },
  { id: 'c-kranich', number: 'K-1005', name: 'Kranich Medien GmbH', city: 'Köln', vatId: 'DE274855013', paymentTermsDays: 30 },
  { id: 'c-talbach', number: 'K-1006', name: 'Talbach Werkzeugbau GmbH', city: 'Villingen', vatId: 'DE198327440', paymentTermsDays: 45 },
];

export const ARTICLES: readonly Article[] = [
  { id: 'a-consulting', number: 'L-100', descriptionKey: 'article.consulting', unit: 'hour', unitPrice: 14500, costPrice: 6200, taxRate: 19 },
  { id: 'a-development', number: 'L-110', descriptionKey: 'article.development', unit: 'hour', unitPrice: 13500, costPrice: 7100, taxRate: 19 },
  { id: 'a-workshop', number: 'L-120', descriptionKey: 'article.workshop', unit: 'day', unitPrice: 145000, costPrice: 62000, taxRate: 19 },
  { id: 'a-hosting', number: 'L-200', descriptionKey: 'article.hosting', unit: 'month', unitPrice: 8900, costPrice: 4300, taxRate: 19 },
  { id: 'a-support', number: 'L-210', descriptionKey: 'article.support', unit: 'month', unitPrice: 24900, costPrice: 9800, taxRate: 19 },
  { id: 'a-handbook', number: 'W-300', descriptionKey: 'article.handbook', unit: 'piece', unitPrice: 3900, costPrice: 2600, taxRate: 7 },
];

const customerStore = signal<readonly Customer[]>(CUSTOMER_SEEDS);

export const customers = customerStore.asReadonly();

export function resetCustomers(): void {
  customerStore.set(CUSTOMER_SEEDS);
}

export function addCustomer(input: {
  readonly name: string;
  readonly city: string;
}): Customer {
  const seq = customerStore().length + 1001;
  const created: Customer = {
    id: `c-${seq}`,
    number: `K-${seq}`,
    name: input.name,
    city: input.city,
    vatId: '',
    paymentTermsDays: 14,
  };
  customerStore.update((all) => [...all, created]);
  return created;
}

export function customerById(id: string): Customer | undefined {
  return customerStore().find((customer) => customer.id === id);
}

export function articleById(id: string): Article | undefined {
  return ARTICLES.find((article) => article.id === id);
}
