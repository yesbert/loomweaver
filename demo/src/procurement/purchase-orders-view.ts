import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { daysLate, openOrderValue, purchaseOrders } from './purchasing';
import { procurementActions } from './procurement-actions';
import { formatDate, formatMoney, supplierName } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'demo-purchase-orders-view',
  imports: [TranslocoPipe],
  templateUrl: './purchase-orders-view.html',
})
export class PurchaseOrdersView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return purchaseOrders().map((order) => ({
      order,
      supplier: supplierName(order.supplierId),
      ordered: formatDate(order.orderedOn, lang),
      expected: formatDate(order.expectedOn, lang),
      net: formatMoney(order.net, lang),
      late: order.status === 'received' ? 0 : daysLate(order.expectedOn),
    }));
  });

  protected readonly outstanding = computed(() => formatMoney(openOrderValue(), this.lang()));

  protected receive(): void {
    void procurementActions.receiveGoods();
  }
}
