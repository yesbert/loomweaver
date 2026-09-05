import { Component, CUSTOM_ELEMENTS_SCHEMA, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { type Customer, customers } from '../accounting';
import { contactsByCustomer } from './contacts';
import { customersActions } from './customers-actions';

export interface CustomerRow {
  readonly customer: Customer;
  readonly contacts: number;
}

@Component({
  selector: 'lw-customer-list-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [TranslocoPipe],
  templateUrl: './customer-list-view.html',
})
export class CustomerListView {
  private readonly transloco = inject(TranslocoService);
  private readonly lang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });

  protected readonly search = signal('');

  protected readonly rows = computed<readonly CustomerRow[]>(() => {
    this.lang();
    const needle = this.search().trim().toLowerCase();
    const byCustomer = contactsByCustomer();
    return customers()
      .filter(
        (customer) =>
          needle === '' ||
          customer.name.toLowerCase().includes(needle) ||
          customer.number.toLowerCase().includes(needle) ||
          customer.city.toLowerCase().includes(needle),
      )
      .map((customer) => ({
        customer,
        contacts: byCustomer.get(customer.id)?.length ?? 0,
      }));
  });

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected create(): void {
    void customersActions.create();
  }
}
