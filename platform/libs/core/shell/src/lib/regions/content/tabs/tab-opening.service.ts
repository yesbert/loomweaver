import { inject, Injector, Service } from '@angular/core';
import { OpenTabInput } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { FeatureSwitches } from '../../../features/feature-switches.service';
import {
  WORKSPACE_CLAIMS,
  WorkspaceClaims,
} from '../../../foundation/workspace-claims';
import { normalizePath, tabRootOf } from '../content-path';
import { OpenTab } from './content-tab-projection';
import { ContentTabState } from './content-tab-state';
import { TabNavigationService } from './tab-navigation.service';
import { PreviewSlotService } from './preview-slot.service';
import { TabCloseHooks } from './tab-close-hooks';
import { relabelled } from './tab-label-update';
import { tabBadgeOf } from '../../pane/chrome/tab-badge';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';

@Service()
export class TabOpeningService {
  private readonly registry = inject(ContributionRegistry);

  private readonly features = inject(FeatureSwitches).content;

  private readonly state = inject(ContentTabState);

  private readonly navigation = inject(TabNavigationService);

  private readonly previewSlot = inject(PreviewSlotService);

  private readonly closeHooks = inject(TabCloseHooks);

  private readonly paneTree = inject(PaneTreeService);

  private readonly injector = inject(Injector);

  private resolvedClaims: WorkspaceClaims | null = null;

  private queue: Promise<void> = Promise.resolve();

  private queued = 0;

  open(input: OpenTabInput): void {
    const path = normalizePath(input.path);
    if (this.queued === 0 && !this.claims.wouldSettle(path)) {
      this.openHere(input);
      return;
    }
    this.inOrder(
      () => this.openHere(input),
      () => this.claims.settle(path),
    );
  }

  keep(path: string): void {
    if (this.queued === 0) {
      this.keepHere(path);
      return;
    }
    this.inOrder(() => this.keepHere(path));
  }

  private get claims(): WorkspaceClaims {
    this.resolvedClaims ??= this.injector.get(WORKSPACE_CLAIMS);
    return this.resolvedClaims;
  }

  private inOrder(
    work: () => void,
    before: () => Promise<void> | undefined = () => undefined,
  ): void {
    this.queued += 1;
    this.queue = this.queue
      .then(before)
      .then(work)
      .catch((error: unknown) =>
        console.error('Opening a content tab failed', error),
      )
      .then(() => {
        this.queued -= 1;
      });
  }

  private openHere(input: OpenTabInput): void {
    const routes = this.registry.contentRoutes();
    const path = normalizePath(input.path);
    const root = tabRootOf(routes, path);
    const previewSlot = (input.preview ?? false) && this.features.preview();
    const existing = this.state.openTabRootedAt(routes, root);
    this.closeHooks.set(root, input.onClose);
    if (!existing && this.relabelWhereHeld(root, input)) {
      return;
    }
    const stored: OpenTab = {
      path: existing?.path ?? path,
      title: input.title,
      literalTitle: input.titleIsLiteral ?? false,
      icon: input.icon,
      badge:
        input.badge === undefined ? existing?.badge : tabBadgeOf(input.badge),
      onClose: input.onClose,
      preview: existing ? existing.preview : previewSlot,
      pinned: existing ? existing.pinned : false,
      closable: existing ? existing.closable : true,
      ownLabel: true,
    };
    if (previewSlot && !existing) {
      this.previewSlot.fill(root, stored);
    } else {
      this.state.updateOpen((tabs) =>
        existing
          ? tabs.map((tab) =>
              tabRootOf(routes, tab.path) === root ? stored : tab,
            )
          : [...tabs, stored],
      );
    }
    this.navigation.navigateTo(stored.path);
  }

  private relabelWhereHeld(root: string, input: OpenTabInput): boolean {
    const routes = this.registry.contentRoutes();
    let found = false;
    for (const [dock, tree] of Object.entries(this.paneTree.dockTrees())) {
      const next = relabelled(
        tree,
        (tabPath) => tabRootOf(routes, tabPath) === root,
        input,
      );
      if (next !== null) {
        this.paneTree.commit(dock, next);
        found = true;
      }
    }
    return found;
  }

  private keepHere(path: string): void {
    const { routes, root } = this.state.rootFor(path);
    this.state.updateOpen((tabs) =>
      tabs.map((tab) =>
        tabRootOf(routes, tab.path) === root && tab.preview
          ? { ...tab, preview: false }
          : tab,
      ),
    );
  }
}
