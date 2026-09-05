import { Component, computed } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { testbedNavState } from './navigation/testbed-nav-state';

@Component({
  selector: 'lw-testbed-status-count',
  imports: [TranslocoPipe],
  templateUrl: './testbed-status-count.html',
})
export class TestbedStatusCount {
  protected readonly count = computed(() => testbedNavState.items().length);
}
