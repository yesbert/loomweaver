import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { isBelowReorderPoint, itemsBelowReorderPoint, stockItems } from './stock';
import { inventoryActions } from './inventory-actions';
import { language, quantityIn } from './inventory-view-model';

@Component({
  selector: 'lw-stock-levels-view',
  imports: [TranslocoPipe],
  templateUrl: './stock-levels-view.html',
})
export class StockLevelsView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    const quantity = quantityIn(() => this.lang());
    return stockItems().map((item) => ({
      item,
      onHand: quantity(item.onHand),
      reorderPoint: quantity(item.reorderPoint),
      low: isBelowReorderPoint(item),
    }));
  });

  protected readonly low = computed(() => itemsBelowReorderPoint().length);

  protected count(): void {
    void inventoryActions.countStock();
  }
}
