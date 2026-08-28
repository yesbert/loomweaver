import { Component, computed, inject } from '@angular/core';
import { VIEW_STATE, ViewState } from '@loomweaver/plugin-sdk';

type OutlineSort = 'natural' | 'alpha';
interface OutlineState {
  readonly sort: OutlineSort;
}

@Component({
  selector: 'lw-testbed-outline-view',
  templateUrl: './testbed-outline-view.html',
})
export class TestbedOutlineView {
  private readonly viewState = inject(VIEW_STATE) as ViewState<OutlineState>;
  private readonly base = ['Row C', 'Row A', 'Row D', 'Row B'];

  protected readonly sort = computed<OutlineSort>(
    () => this.viewState.value()?.sort ?? 'natural',
  );
  protected readonly sections = computed(() =>
    this.sort() === 'alpha'
      ? [...this.base].sort((a, b) => a.localeCompare(b))
      : this.base,
  );

  protected toggleSort(): void {
    this.viewState.set({ sort: this.sort() === 'alpha' ? 'natural' : 'alpha' });
  }
}
