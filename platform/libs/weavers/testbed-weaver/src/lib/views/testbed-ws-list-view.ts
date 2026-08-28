import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { CONTAINER_HANDLE } from '@loomweaver/plugin-sdk';

const ITEMS = ['alpha', 'beta', 'gamma', 'delta'] as const;

@Component({
  selector: 'lw-testbed-ws-list-view',
  imports: [TranslocoPipe],
  templateUrl: './testbed-ws-list-view.html',
})
export class TestbedWsListView {
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly container = inject(CONTAINER_HANDLE);

  protected readonly items = ITEMS;
  protected readonly simId = this.route?.snapshot.paramMap.get('id') ?? '—';

  protected open(item: string): void {
    this.container?.open(`item/${item}`, {
      title: item,
      titleIsLiteral: true,
      icon: 'testbedEntry',
    });
  }
}
