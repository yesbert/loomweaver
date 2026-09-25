import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { openReceivables, periods } from './books';

@Component({
  selector: 'lw-closing-view',
  imports: [TranslocoPipe],
  templateUrl: './closing-view.html',
})
export class ClosingView {
  protected readonly rows = periods;

  protected readonly blocking = computed(() => openReceivables().length);
}
