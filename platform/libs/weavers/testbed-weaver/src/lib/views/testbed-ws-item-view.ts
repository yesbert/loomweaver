import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lw-testbed-ws-item-view',
  imports: [TranslocoPipe],
  templateUrl: './testbed-ws-item-view.html',
})
export class TestbedWsItemView {
  private readonly route = inject(ActivatedRoute, { optional: true });

  protected readonly itemId =
    this.route?.snapshot.paramMap.get('itemId') ?? '—';
  protected readonly simId = this.route?.snapshot.paramMap.get('id') ?? '—';
  protected readonly note = signal('');

  protected onNote(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }
}
