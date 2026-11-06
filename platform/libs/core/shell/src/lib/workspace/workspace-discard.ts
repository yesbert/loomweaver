import {
  afterNextRender,
  DestroyRef,
  inject,
  Injector,
  Service,
} from '@angular/core';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import { paneRetentionScope } from '../regions/pane/retention/retention-keys';
import { CONTENT_DOCK } from '../regions/pane/tree/pane-address';
import { SurfaceCloseGuard } from '../regions/pane/unsaved-work/surface-close-guard';
import { UnsavedWork } from '../regions/pane/unsaved-work/unsaved-work';
import { ActiveWorkspaceService } from './active-workspace.service';

@Service()
export class WorkspaceDiscard {
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly unsavedWork = inject(UnsavedWork);
  private readonly stash = inject(RetainedViewStash);
  private readonly active = inject(ActiveWorkspaceService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  confirmDiscardAll(): Promise<boolean> {
    return this.closeGuard.confirmDiscard(
      this.unsavedWork.instancesEverywhere(),
    );
  }

  confirmDiscardOf(
    workspaceId: string,
    spared: readonly unknown[] = [],
  ): Promise<boolean> {
    const asked = [
      ...this.stash.parkedInstancesOf(workspaceId),
      ...(workspaceId === this.active.id() ? this.shownInstances() : []),
    ];
    return this.closeGuard.confirmDiscard(
      asked.filter((instance) => !spared.includes(instance)),
    );
  }

  shownAt(primaryPane: string, path: string): unknown[] {
    return this.unsavedWork.instancesAt(
      paneRetentionScope(CONTENT_DOCK, primaryPane),
      path,
    );
  }

  forgetOnceLetGo(workspaceId: string, spared: readonly unknown[] = []): void {
    if (this.destroyRef.destroyed) {
      return;
    }
    afterNextRender(
      () => this.stash.evictWorkspace(workspaceId, new Set(spared)),
      { injector: this.injector },
    );
  }

  private shownInstances(): unknown[] {
    const parked = new Set(this.stash.parked().map((entry) => entry.instance));
    return this.unsavedWork
      .instancesEverywhere()
      .filter((instance) => !parked.has(instance));
  }
}
