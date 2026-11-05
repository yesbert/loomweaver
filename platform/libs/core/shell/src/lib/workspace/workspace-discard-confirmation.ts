import { inject, Service } from '@angular/core';
import { SurfaceCloseGuard } from '../regions/pane/unsaved-work/surface-close-guard';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import { UnsavedWork } from '../regions/pane/unsaved-work/unsaved-work';
import { ActiveWorkspaceService } from './active-workspace.service';

@Service()
export class WorkspaceDiscardConfirmation {
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly unsavedWork = inject(UnsavedWork);
  private readonly stash = inject(RetainedViewStash);
  private readonly active = inject(ActiveWorkspaceService);

  confirmDiscardAll(): Promise<boolean> {
    return this.closeGuard.confirmDiscard(
      this.unsavedWork.instancesEverywhere(),
    );
  }

  confirmDiscardOf(workspaceId: string): Promise<boolean> {
    return this.closeGuard.confirmDiscard([
      ...this.stash.parkedInstancesOf(workspaceId),
      ...(workspaceId === this.active.id() ? this.shownInstances() : []),
    ]);
  }

  private shownInstances(): unknown[] {
    const parked = new Set(this.stash.parked().map((entry) => entry.instance));
    return this.unsavedWork
      .instancesEverywhere()
      .filter((instance) => !parked.has(instance));
  }
}
