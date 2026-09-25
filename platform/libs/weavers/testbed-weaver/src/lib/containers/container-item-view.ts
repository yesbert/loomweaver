import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { containerIdFromRoute } from './container-id';

@Component({
  selector: 'lw-testbed-container-item-view',
  imports: [TranslocoPipe],
  templateUrl: './container-item-view.html',
})
export class ContainerItemView {
  private readonly route = inject(ActivatedRoute, { optional: true });

  protected readonly itemId =
    this.route?.snapshot.paramMap.get('itemId') ?? '—';
  protected readonly containerId = containerIdFromRoute();
  protected readonly note = signal('');

  protected onNote(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }
}
