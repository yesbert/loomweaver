import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { daysLate, openOrderValue, purchaseOrders } from './purchasing';
import { dateIn, language, moneyIn, supplierName } from './procurement-view-model';
import { procurementActions } from './procurement-actions';

@Component({
  selector: 'lw-purchase-orders-view',
  imports: [TranslocoPipe],
  templateUrl: './purchase-orders-view.html',
})
export class PurchaseOrdersView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    const money = moneyIn(() => this.lang());
    const date = dateIn(() => this.lang());
    return purchaseOrders().map((order) => ({
      order,
      supplier: supplierName(order.supplierId),
      ordered: date(order.orderedOn),
      expected: date(order.expectedOn),
      net: money(order.net),
      late: order.status === 'received' ? 0 : daysLate(order.expectedOn),
    }));
  });

  protected readonly outstanding = computed(() => moneyIn(() => this.lang())(openOrderValue()));

  protected receive(): void {
    void procurementActions.receiveGoods();
  }
}
