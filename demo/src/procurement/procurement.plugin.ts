import { Plugin } from '@loomweaver/plugin-sdk';
import { PurchaseOrdersView } from './purchase-orders-view';
import { SupplierListView } from './supplier-list-view';
import { procurementActions } from './procurement-actions';

export const procurementPlugin: Plugin = {
  manifest: {
    id: 'procurement',
    name: 'Procurement',
    capabilities: ['contributions', 'navigation', 'ui'],
  },
  activate(ctx) {
    procurementActions.bind(ctx);

    ctx.registerSurface({
      id: 'procurement.suppliers',
      title: 'procurement.view.supplierList',
      icon: 'supplierList',
      routable: { path: 'procurement/suppliers' },
      docks: [],
      component: SupplierListView,
    });
    ctx.registerSurface({
      id: 'procurement.orders',
      title: 'procurement.view.purchaseOrders',
      icon: 'purchaseOrders',
      routable: { path: 'procurement/orders' },
      docks: [],
      component: PurchaseOrdersView,
    });

    ctx.registerCommand({
      id: 'procurement.goodsReceipt',
      title: 'procurement.receiveGoods',
      description: 'procurement.receiptDescription',
      icon: 'purchaseOrders',
      callable: true,
      answers: 'procurement.receiptAnswers',
      run: async () => ({ received: await procurementActions.receiveGoods() }),
    });
  },
  deactivate() {
    procurementActions.unbind();
  },
};
