import { inject, Injector, Service } from '@angular/core';
import {
  WORKSPACE_CLAIMS,
  WorkspaceClaims,
} from '../../../foundation/workspace-claims';

@Service()
export class ClaimOrdering {
  private readonly injector = inject(Injector);

  private resolved: WorkspaceClaims | null = null;

  private ordered: Promise<void> = Promise.resolve();

  private queued = 0;

  run(path: string | null, work: () => void): void {
    if (this.queued === 0 && (path === null || !this.claims.wouldSettle(path))) {
      work();
      return;
    }
    this.queued += 1;
    this.ordered = this.ordered
      .then(() => (path === null ? undefined : this.claims.settle(path)))
      .then(work)
      .catch(() => undefined)
      .then(() => {
        this.queued -= 1;
      });
  }

  private get claims(): WorkspaceClaims {
    this.resolved ??= this.injector.get(WORKSPACE_CLAIMS);
    return this.resolved;
  }
}
