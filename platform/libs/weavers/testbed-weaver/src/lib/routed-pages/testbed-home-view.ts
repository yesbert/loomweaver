import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { testbedContent } from '../plugin/testbed-content';

@Component({
  imports: [TranslocoPipe],
  selector: 'lw-testbed-home-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './testbed-home-view.html',
})
export class TestbedHomeView {
  protected dashboard(): void {
    testbedContent.goDashboard();
  }

  protected list(): void {
    testbedContent.revealList();
  }
}
