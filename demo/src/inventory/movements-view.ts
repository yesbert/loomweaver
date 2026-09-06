import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { movements } from './stock';
import {
  dateIn,
  itemLabelKey,
  itemNumber,
  language,
  quantityIn,
} from './inventory-view-model';

@Component({
  selector: 'lw-movements-view',
  imports: [TranslocoPipe],
  templateUrl: './movements-view.html',
})
export class MovementsView {
  private readonly lang = language();

  protected readonly rows = computed(() => {
    const quantity = quantityIn(() => this.lang());
    const date = dateIn(() => this.lang());
    return movements().map((movement) => ({
      movement,
      number: itemNumber(movement.itemId),
      labelKey: itemLabelKey(movement.itemId),
      booked: date(movement.bookedOn),
      quantity: quantity(Math.abs(movement.quantity)),
      incoming: movement.quantity > 0,
    }));
  });
}
