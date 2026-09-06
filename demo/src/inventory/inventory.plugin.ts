import { Plugin } from '@loomweaver/plugin-sdk';
import { MovementsView } from './movements-view';
import { StockLevelsView } from './stock-levels-view';
import { inventoryActions } from './inventory-actions';

export const inventoryPlugin: Plugin = {
  manifest: {
    id: 'inventory',
    name: 'Inventory',
    capabilities: ['contributions', 'navigation', 'ui'],
  },
  activate(ctx) {
    inventoryActions.bind(ctx);

    ctx.registerSurface({
      id: 'inventory.stock',
      title: 'product.view.stockLevels',
      icon: 'stockLevels',
      routable: { path: 'inventory/stock' },
      docks: [],
      padded: false,
      component: StockLevelsView,
    });
    ctx.registerSurface({
      id: 'inventory.movements',
      title: 'product.view.movements',
      icon: 'movements',
      routable: { path: 'inventory/movements' },
      docks: [],
      padded: false,
      component: MovementsView,
    });

    ctx.registerCommand({
      id: 'inventory.countStock',
      title: 'product.inventory.countStock',
      description: 'product.inventory.count.description',
      icon: 'stockLevels',
      callable: true,
      answers: 'product.inventory.count.answers',
      run: async () => ({ counted: await inventoryActions.countStock() }),
    });
  },
  deactivate() {
    inventoryActions.unbind();
  },
};
