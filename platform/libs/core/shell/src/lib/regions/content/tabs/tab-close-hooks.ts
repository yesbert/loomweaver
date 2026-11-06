import { inject, Service, untracked } from '@angular/core';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { collectTabPaths } from '../../pane/tree/pane-queries';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { tabRootOf } from '../content-path';

@Service()
export class TabCloseHooks {
  private readonly registry = inject(ContributionRegistry);

  private readonly paneTree = inject(PaneTreeService);

  private readonly hooks = new Map<string, () => void>();

  constructor() {
    this.paneTree.whenTabsLeave((paths) => {
      for (const root of new Set(paths.map((path) => this.rootOf(path)))) {
        this.runOnceGone(root);
      }
    });
  }

  get(root: string): (() => void) | undefined {
    return this.hooks.get(root);
  }

  set(root: string, hook: (() => void) | undefined): void {
    if (hook) {
      this.hooks.set(root, hook);
    } else {
      this.hooks.delete(root);
    }
  }

  runOnceGone(root: string): void {
    const hook = this.hooks.get(root);
    const held = Object.values(untracked(() => this.paneTree.dockTrees()))
      .flatMap((tree) => collectTabPaths(tree))
      .some((path) => this.rootOf(path) === root);
    if (held || !hook) {
      return;
    }
    this.hooks.delete(root);
    try {
      hook();
    } catch (error) {
      console.error('Content tab onClose handler failed', error);
    }
  }

  private rootOf(path: string): string {
    return tabRootOf(untracked(() => this.registry.contentRoutes()), path);
  }
}
