import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { testbedActiveContent } from '../plugin/testbed-active-content';
import { testbedContent } from '../plugin/testbed-content';

@Component({
  imports: [TranslocoPipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'lw-testbed-nav-tree-view',
  templateUrl: './testbed-nav-tree-view.html',
})
export class TestbedNavTreeView {
  protected shown(): string {
    return testbedActiveContent.path();
  }

  protected go(event: Event): void {
    testbedContent.goTo((event as CustomEvent<{ path: string }>).detail.path);
  }
}
