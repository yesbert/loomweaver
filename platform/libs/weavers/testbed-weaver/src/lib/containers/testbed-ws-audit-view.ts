import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'lw-testbed-ws-audit-view',
  imports: [TranslocoPipe],
  templateUrl: './testbed-ws-audit-view.html',
})
export class TestbedWsAuditView {
  private readonly route = inject(ActivatedRoute, { optional: true });

  protected readonly simId = this.route?.snapshot.paramMap.get('id') ?? '—';
}
