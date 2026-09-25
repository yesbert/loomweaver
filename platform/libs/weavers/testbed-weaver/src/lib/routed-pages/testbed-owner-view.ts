import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

function lastSegment(url: readonly { readonly path: string }[]): string {
  return url.at(-1)?.path ?? 'queue';
}

@Component({
  selector: 'lw-testbed-owner-view',
  imports: [TranslocoPipe],
  templateUrl: './testbed-owner-view.html',
})
export class TestbedOwnerView {
  private readonly route = inject(ActivatedRoute);

  protected readonly ownerId = this.route.snapshot.paramMap.get('ownerId') ?? '';

  protected readonly facet = lastSegment(this.route.snapshot.url);
}
