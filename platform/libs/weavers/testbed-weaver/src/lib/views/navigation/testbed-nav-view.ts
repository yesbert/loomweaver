import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { testbedScratch } from '../../plugin/testbed-scratch';
import { testbedNavState } from './testbed-nav-state';

@Component({
  imports: [TranslocoPipe],
  selector: 'lw-testbed-nav-view',
  templateUrl: './testbed-nav-view.html',
})
export class TestbedNavView {
  protected readonly items = testbedNavState.items;

  protected readonly scratch = testbedScratch;
}
