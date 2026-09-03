import { inject, Service } from '@angular/core';
import { SurfaceCloseGuard } from '../regions/pane/close/surface-close-guard';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import { RetentionCandidates } from '../regions/pane/retention/retention-candidates';

@Service()
export class WorkspaceGuard {
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly retention = inject(RetentionCandidates);
  private readonly stash = inject(RetainedViewStash);

  confirmDiscardAll(): Promise<boolean> {
    return this.closeGuard.confirmDiscard(this.retention.all());
  }

  confirmDiscardParked(workspaceId: string): Promise<boolean> {
    return this.closeGuard.confirmDiscard(
      this.stash.parkedInstancesOf(workspaceId),
    );
  }
}
