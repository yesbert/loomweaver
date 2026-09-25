import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { itemLabelKey, itemNumber, movements } from './stock';
import { formatDate, formatQuantity } from '../accounting';
import { activeLanguage } from '../i18n/active-language';

@Component({
  selector: 'lw-movements-view',
  imports: [TranslocoPipe],
  templateUrl: './movements-view.html',
})
export class MovementsView {
  private readonly lang = activeLanguage();

  protected readonly rows = computed(() => {
    const lang = this.lang();
    return movements().map((movement) => ({
      movement,
      number: itemNumber(movement.itemId),
      labelKey: itemLabelKey(movement.itemId),
      booked: formatDate(movement.bookedOn, lang),
      quantity: formatQuantity(Math.abs(movement.quantity), lang),
      incoming: movement.quantity > 0,
    }));
  });
}
