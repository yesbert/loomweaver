import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lw-testbed-ws-details-view',
  imports: [TranslocoPipe],
  templateUrl: './testbed-ws-details-view.html',
})
export class TestbedWsDetailsView {
  private readonly route = inject(ActivatedRoute, { optional: true });

  protected readonly simId = this.route?.snapshot.paramMap.get('id') ?? '—';
  protected readonly agents = this.simId.length * 4;
  protected readonly ticks = this.simId.length * 128;
}
