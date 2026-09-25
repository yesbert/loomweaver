import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { isBelowReorderPoint, itemsBelowReorderPoint, stockItems } from './stock';
import { inventoryActions } from './inventory-actions';
import { formatQuantity } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'demo-stock-levels-view',
  imports: [TranslocoPipe],
  templateUrl: './stock-levels-view.html',
})
export class StockLevelsView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return stockItems().map((item) => ({
      item,
      onHand: formatQuantity(item.onHand, lang),
      reorderPoint: formatQuantity(item.reorderPoint, lang),
      low: isBelowReorderPoint(item),
    }));
  });

  protected readonly low = computed(() => itemsBelowReorderPoint().length);

  protected count(): void {
    void inventoryActions.countStock();
  }
}
