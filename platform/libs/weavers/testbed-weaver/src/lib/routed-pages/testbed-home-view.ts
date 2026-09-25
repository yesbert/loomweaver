import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { testbedContext } from '../bound-context';
import { DASHBOARD_OVERVIEW_PATH } from '../dashboard/register-dashboard';
import { entryTabs } from '../entry-tabs/entry-tab-actions';

@Component({
  imports: [TranslocoPipe],
  selector: 'lw-testbed-home-view',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './testbed-home-view.html',
})
export class TestbedHomeView {
  protected dashboard(): void {
    testbedContext.navigateTo(DASHBOARD_OVERVIEW_PATH);
  }

  protected list(): void {
    entryTabs.revealList();
  }
}
