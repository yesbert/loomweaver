import { effect, inject, Service, untracked } from '@angular/core';
import { AuthContext } from '../../auth/auth-context';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import {
  matchRoute,
  normalizePath,
  tabRootOf,
} from '../../regions/content/content-path';
import { ContentRouter } from '../../regions/content/routing/content-router';
import { CONTENT_DOCK } from '../../regions/pane/tree/pane-address';
import { leavesOf } from '../../regions/pane/tree/pane-queries';
import { PaneTreeService } from '../../regions/pane/tree/pane-tree.service';
import { ActiveWorkspaceService } from '../active-workspace.service';

@Service()
export class WithheldVisits {
  private readonly active = inject(ActiveWorkspaceService);
  private readonly auth = inject(AuthContext);
  private readonly contentRouter = inject(ContentRouter);
  private readonly paneTree = inject(PaneTreeService);
  private readonly registry = inject(ContributionRegistry);

  private readonly waitingIn = new Map<string, string>();

  constructor() {
    effect(() => {
      this.auth.state();
      untracked(() => this.leaveWhatNowQualifiesElsewhere());
    });
  }

  note(path: string): void {
    const root = this.rootOf(path);
    if (this.waitsHere(root) || this.holdsContentAt(root)) {
      return;
    }
    this.waitingIn.set(root, this.active.id());
  }

  leave(path: string): void {
    const root = this.rootOf(path);
    for (const waiting of this.waitingIn.keys()) {
      if (waiting === root || this.qualifies(waiting)) {
        this.release(waiting);
      }
    }
  }

  forget(): void {
    this.waitingIn.clear();
  }

  private leaveWhatNowQualifiesElsewhere(): void {
    const shown = this.rootOf(this.contentRouter.here());
    for (const root of this.waitingIn.keys()) {
      if (root !== shown && this.qualifies(root)) {
        this.release(root);
      }
    }
  }

  private release(root: string): void {
    if (this.waitsHere(root)) {
      this.removeContentAt(root);
    }
    this.waitingIn.delete(root);
  }

  private qualifies(root: string): boolean {
    return this.auth.meets(
      matchRoute(this.registry.contentRoutes(), root)?.access,
    );
  }

  private waitsHere(root: string): boolean {
    return this.waitingIn.get(root) === this.active.id();
  }

  private holdsContentAt(root: string): boolean {
    return leavesOf(this.paneTree.tree(CONTENT_DOCK)).some((leaf) =>
      leaf.tabs.some((tab) => this.rootOf(tab.path) === root),
    );
  }

  private removeContentAt(root: string): void {
    for (const leaf of leavesOf(this.paneTree.tree(CONTENT_DOCK))) {
      for (const tab of leaf.tabs) {
        if (this.rootOf(tab.path) === root) {
          this.paneTree.removeTab(CONTENT_DOCK, leaf.id, tab.path);
        }
      }
    }
  }

  private rootOf(path: string): string {
    return tabRootOf(this.registry.contentRoutes(), normalizePath(path));
  }
}
