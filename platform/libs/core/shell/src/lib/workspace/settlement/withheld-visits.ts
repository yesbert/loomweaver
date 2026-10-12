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

  private readonly waiting = new Map<string, Set<string>>();

  constructor() {
    effect(() => {
      this.auth.state();
      untracked(() => this.releaseWhatQualifies());
    });
  }

  note(path: string): void {
    const root = this.rootOf(path);
    if (this.holdsContentAt(root)) {
      return;
    }
    const here = this.active.id();
    this.waiting.set(here, new Set([...this.waitingHere(), root]));
  }

  leave(path: string): void {
    this.releaseWhatQualifies(this.rootOf(path));
  }

  arrived(): void {
    this.releaseWhatQualifies();
  }

  forget(): void {
    this.waiting.clear();
  }

  private releaseWhatQualifies(settling?: string): void {
    const shown = this.rootOf(this.contentRouter.here());
    const waiting = this.waitingHere();
    for (const root of waiting) {
      if (root !== settling && (root === shown || !this.qualifies(root))) {
        continue;
      }
      this.removeContentAt(root);
      waiting.delete(root);
    }
  }

  private waitingHere(): Set<string> {
    return this.waiting.get(this.active.id()) ?? new Set();
  }

  private qualifies(root: string): boolean {
    return this.auth.meets(
      matchRoute(this.registry.contentRoutes(), root)?.access,
    );
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
