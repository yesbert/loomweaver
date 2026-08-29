import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lw-testbed-ws-canvas-view',
  imports: [TranslocoPipe],
  templateUrl: './testbed-ws-canvas-view.html',
})
export class TestbedWsCanvasView {
  private readonly route = inject(ActivatedRoute, { optional: true });

  protected readonly simId = this.route?.snapshot.paramMap.get('id') ?? '—';
  protected readonly nodes = Array.from(
    { length: 6 },
    (_, index) => `${this.simId}-${index + 1}`,
  );
}
