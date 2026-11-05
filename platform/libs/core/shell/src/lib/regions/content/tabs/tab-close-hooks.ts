import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { leavesOf } from '../../pane/tree/pane-queries';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { tabRootOf } from '../content-path';

@Service()
export class TabCloseHooks {
  private readonly registry = inject(ContributionRegistry);

  private readonly paneTree = inject(PaneTreeService);

  private readonly hooks = new Map<string, () => void>();

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
    const routes = this.registry.contentRoutes();
    const held = leavesOf(this.paneTree.tree(CONTENT_DOCK)).some((leaf) =>
      leaf.tabs.some((tab) => tabRootOf(routes, tab.path) === root),
    );
    const hook = this.hooks.get(root);
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
}
