import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { openOrdersBySupplier } from './purchasing';
import { SUPPLIERS } from '../accounting';

@Component({
  selector: 'demo-supplier-list-view',
  imports: [TranslocoPipe],
  templateUrl: './supplier-list-view.html',
})
export class SupplierListView {
  protected readonly rows = computed(() => {
    const open = openOrdersBySupplier();
    return SUPPLIERS.map((supplier) => ({
      supplier,
      openOrders: open.get(supplier.id) ?? 0,
    }));
  });

  protected readonly count = computed(() => this.rows().length);
}
