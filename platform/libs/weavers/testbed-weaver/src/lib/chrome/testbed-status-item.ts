import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lw-testbed-status-item',
  imports: [TranslocoPipe],
  templateUrl: './testbed-status-item.html',
})
export class TestbedStatusItem {}
