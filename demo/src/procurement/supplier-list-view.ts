import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { SUPPLIERS, openOrdersBySupplier } from './purchasing';
import { language } from './procurement-view-model';

@Component({
  selector: 'lw-supplier-list-view',
  imports: [TranslocoPipe],
  templateUrl: './supplier-list-view.html',
})
export class SupplierListView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    this.lang();
    const open = openOrdersBySupplier();
    return SUPPLIERS.map((supplier) => ({
      supplier,
      openOrders: open.get(supplier.id) ?? 0,
    }));
  });

  protected readonly count = computed(() => this.rows().length);
}
