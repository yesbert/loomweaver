import {
  afterNextRender,
  DestroyRef,
  inject,
  Injector,
  Service,
} from '@angular/core';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { DockTrees } from '../regions/pane/retention/open-tabs';
import { RetainedViewStash } from '../regions/pane/retention/retained-view-stash';
import { paneRetentionScope } from '../regions/pane/retention/retention-keys';
import { CONTENT_DOCK, PRIMARY_PANE } from '../regions/pane/tree/pane-address';
import { PaneTreeService } from '../regions/pane/tree/pane-tree.service';
import { DockEntry } from '../regions/pane/tree/stored-pane-tree';
import { SurfaceCloseGuard } from '../regions/pane/unsaved-work/surface-close-guard';
import { UnsavedWork } from '../regions/pane/unsaved-work/unsaved-work';
import {
  ActiveWorkspaceService,
  workspaceScopedKey,
} from './active-workspace.service';
import { WorkspaceCatalog } from './catalog/workspace-catalog';
import { WORKSPACE_STATE_KEYS } from './working-state/state-channels';
import { WorkspaceSwitcher } from './workspace-switcher';

@Service()
export class WorkspaceDiscard {
  private readonly closeGuard = inject(SurfaceCloseGuard);
  private readonly unsavedWork = inject(UnsavedWork);
  private readonly stash = inject(RetainedViewStash);
  private readonly active = inject(ActiveWorkspaceService);
  private readonly catalog = inject(WorkspaceCatalog);
  private readonly switcher = inject(WorkspaceSwitcher);
  private readonly paneTree = inject(PaneTreeService);
  private readonly workingStateStore = inject(WORKING_STATE_STORE);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  confirmDiscardAll(): Promise<boolean> {
    return this.closeGuard.confirmDiscard(
      this.unsavedWork.instancesEverywhere(),
    );
  }

  async confirmDiscardOf(
    workspaceId: string,
    keptAddress: string | null = null,
  ): Promise<boolean> {
    const shown =
      workspaceId === this.active.id()
        ? await this.lostByLeavingForTheStart(keptAddress)
        : [];
    return this.closeGuard.confirmDiscard([
      ...this.stash.parkedInstancesOf(workspaceId),
      ...shown,
    ]);
  }

  forget(workspaceId: string): void {
    this.stash.evictWorkspace(workspaceId);
    for (const key of WORKSPACE_STATE_KEYS) {
      void this.workingStateStore.delete(workspaceScopedKey(key, workspaceId));
    }
  }

  forgetOnceLetGo(workspaceId: string): void {
    if (this.destroyRef.destroyed) {
      return;
    }
    afterNextRender(() => this.stash.evictWorkspace(workspaceId), {
      injector: this.injector,
    });
  }

  private async lostByLeavingForTheStart(
    keptAddress: string | null,
  ): Promise<unknown[]> {
    const arriving = await this.switcher.arrangementOf(this.catalog.startingId);
    const lost = this.unsavedWork.lostBy(
      this.paneTree.dockTrees(),
      treesOf(arriving),
    );
    if (keptAddress === null) {
      return lost;
    }
    const staying = new Set(
      this.unsavedWork.instancesAt(
        paneRetentionScope(
          CONTENT_DOCK,
          arriving[CONTENT_DOCK]?.primary ?? PRIMARY_PANE,
        ),
        keptAddress,
      ),
    );
    return lost.filter((instance) => !staying.has(instance));
  }
}

function treesOf(docks: Readonly<Record<string, DockEntry>>): DockTrees {
  return Object.fromEntries(
    Object.entries(docks).map(([dock, entry]) => [dock, entry.node]),
  );
}
