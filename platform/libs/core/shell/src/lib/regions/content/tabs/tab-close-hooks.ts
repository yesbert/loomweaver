import { inject, Service, untracked } from '@angular/core';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import {
  containerPathOfDock,
  isContainerDock,
} from '../../pane/container/container-children';
import { collectTabPaths } from '../../pane/tree/pane-queries';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { tabRootOf } from '../content-path';

@Service()
export class TabCloseHooks {
  private readonly registry = inject(ContributionRegistry);

  private readonly paneTree = inject(PaneTreeService);

  private readonly hooks = new Map<string, () => void>();

  constructor() {
    this.paneTree.whenTabsLeave((paths) => this.runForRootsOf(paths));
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

  closing(change: () => void): void {
    const before = Object.values(untracked(() => this.paneTree.dockTrees()))
      .flatMap((tree) => collectTabPaths(tree));
    change();
    this.runForRootsOf(before);
  }

  discarded(before: readonly string[], after: readonly string[]): void {
    const kept = new Set(after.map((path) => this.rootOf(path)));
    this.runForRootsOf(before.filter((path) => !kept.has(this.rootOf(path))));
  }

  runOnceGone(root: string): void {
    const hook = this.hooks.get(root);
    if (!hook || this.held(root)) {
      return;
    }
    this.hooks.delete(root);
    try {
      hook();
    } catch (error) {
      console.error('Content tab onClose handler failed', error);
    }
  }

  private runForRootsOf(paths: readonly string[]): void {
    for (const root of new Set(paths.map((path) => this.rootOf(path)))) {
      this.runOnceGone(root);
    }
  }

  private held(root: string): boolean {
    return Object.entries(untracked(() => this.paneTree.dockTrees()))
      .filter(([dock]) => !this.isContainerOf(dock, root))
      .flatMap(([, tree]) => collectTabPaths(tree))
      .some((path) => this.rootOf(path) === root);
  }

  private isContainerOf(dock: string, root: string): boolean {
    return (
      isContainerDock(dock) && this.rootOf(containerPathOfDock(dock)) === root
    );
  }

  private rootOf(path: string): string {
    return tabRootOf(untracked(() => this.registry.contentRoutes()), path);
  }
}
