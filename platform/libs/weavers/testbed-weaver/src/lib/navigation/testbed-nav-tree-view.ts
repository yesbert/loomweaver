import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { testbedActiveContent } from '../state-readouts/testbed-active-content';
import { testbedContext } from '../bound-context';

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
    testbedContext.navigateTo((event as CustomEvent<{ path: string }>).detail.path);
  }
}
