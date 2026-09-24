import { inject, Service } from '@angular/core';
import { SurfaceCloseGuard } from '../regions/pane/unsaved-work/surface-close-guard';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import { UnsavedWork } from '../regions/pane/unsaved-work/unsaved-work';

@Service()
export class WorkspaceGuard {
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly unsavedWork = inject(UnsavedWork);
  private readonly stash = inject(RetainedViewStash);

  confirmDiscardAll(): Promise<boolean> {
    return this.closeGuard.confirmDiscard(
      this.unsavedWork.instancesEverywhere(),
    );
  }

  confirmDiscardParked(workspaceId: string): Promise<boolean> {
    return this.closeGuard.confirmDiscard(
      this.stash.parkedInstancesOf(workspaceId),
    );
  }
}
