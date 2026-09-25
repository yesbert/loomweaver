import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CONTAINER_HANDLE } from '@loomweaver/plugin-sdk';
import { containerIdFromRoute } from './container-id';

const ITEMS = ['alpha', 'beta', 'gamma', 'delta'] as const;

@Component({
  selector: 'lw-testbed-container-list-view',
  imports: [TranslocoPipe],
  templateUrl: './container-list-view.html',
})
export class ContainerListView {
  private readonly container = inject(CONTAINER_HANDLE);

  protected readonly items = ITEMS;
  protected readonly containerId = containerIdFromRoute();

  protected open(item: string): void {
    this.container?.open(`item/${item}`, {
      title: item,
      titleIsLiteral: true,
      icon: 'testbedEntry',
    });
  }
}
