import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  imports: [TranslocoPipe],
  selector: 'lw-testbed-search-view',
  templateUrl: './testbed-search-view.html',
})
export class TestbedSearchView {}
