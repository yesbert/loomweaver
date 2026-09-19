import { inject, Service } from '@angular/core';
import { OpenTabInput } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { FeatureSwitches } from '../../../features/feature-switches.service';
import { normalizePath, tabRootOf } from '../content-path';
import { TabCloseHooks } from './tab-close-hooks';
import { TabClosingService } from './tab-closing.service';
import { OpenTabsService } from './open-tabs.service';
import { OpenTab } from './content-tab-projection';
import { ContentReuseStrategy } from '../routing/content-reuse-strategy';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneLeaf, PaneTab, newPaneId } from '../../pane/tree/pane-node';
import { findLeaf, findLeafWhere } from '../../pane/tree/pane-queries';
import { promotedLeafOf } from '../../pane/tree/pane-handover';
import { splitLeafWith } from '../../pane/tree/pane-structure';
import {
  openTabInLeaf,
  refineTabTitles,
  setActiveTab,
} from '../../pane/tree/pane-tabs';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';
import { PaneChromeService } from '../../pane/chrome/pane-chrome.service';

@Service()
export class TabOpeningService {
  private readonly registry = inject(ContributionRegistry);

  private readonly features = inject(FeatureSwitches).content;

  private readonly paneTree = inject(PaneTreeService);

  private readonly chrome = inject(PaneChromeService);

  private readonly closeHooks = inject(TabCloseHooks);

  private readonly closing = inject(TabClosingService);

  private readonly state = inject(OpenTabsService);

  private readonly reuse = inject(ContentReuseStrategy);

  open(input: OpenTabInput): void {
    if (input.beside === true) {
      this.openBeside(input);
    } else {
      this.openHere(input);
    }
  }

  private openBeside(input: OpenTabInput): void {
    const routes = this.registry.contentRoutes();
    const path = normalizePath(input.path);
    const root = tabRootOf(routes, path);
    const holds = (leaf: PaneLeaf) =>
      leaf.tabs.some((tab) => tabRootOf(routes, tab.path) === root);
    const tree = this.paneTree.tree(CONTENT_DOCK);
    const neighbour = promotedLeafOf(
      tree,
      this.paneTree.primaryId(CONTENT_DOCK),
    );
    if (
      this.heldOutside(neighbour, holds) ||
      (neighbour === null && !this.features.splitRight())
    ) {
      this.openHere(input);
      return;
    }
    this.closeHooks.set(root, input.onClose);
    const neighbourLeaf = neighbour === null ? null : findLeaf(tree, neighbour);
    if (neighbourLeaf !== null && holds(neighbourLeaf)) {
      this.showHeld(neighbourLeaf, root, input);
    } else if (neighbour === null) {
      this.splitOff(this.besideTab(path, input));
    } else {
      this.openIn(neighbour, this.besideTab(path, input));
    }
  }

  private heldOutside(
    neighbour: string | null,
    holds: (leaf: PaneLeaf) => boolean,
  ): boolean {
    return Object.entries(this.paneTree.dockTrees()).some(
      ([dock, tree]) =>
        findLeafWhere(
          tree,
          (leaf) =>
            !(dock === CONTENT_DOCK && leaf.id === neighbour) && holds(leaf),
        ) !== null,
    );
  }

  private replacePreviewSlot(root: string, slot: OpenTab): void {
    const routes = this.registry.contentRoutes();
    const previous = this.state.openTabs().find((tab) => tab.preview);
    const previousRoot = previous
      ? tabRootOf(routes, previous.path)
      : undefined;
    this.state.updateOpen((tabs) =>
      previous
        ? tabs.map((tab) =>
            tabRootOf(routes, tab.path) === previousRoot ? slot : tab,
          )
        : [...tabs, slot],
    );
    if (previousRoot !== undefined && previousRoot !== root) {
      this.reuse.evict(previousRoot);
      this.closeHooks.runSafely(previous?.onClose);
      this.closeHooks.delete(previousRoot);
    }
  }

  private refineElsewhere(root: string, input: OpenTabInput): boolean {
    const routes = this.registry.contentRoutes();
    const urlPane = this.paneTree.primaryId(CONTENT_DOCK);
    let foundAnywhere = false;
    for (const [dock, tree] of Object.entries(this.paneTree.dockTrees())) {
      const { node, found } = refineTabTitles(
        tree,
        (leaf) => dock === CONTENT_DOCK && leaf.id === urlPane,
        (tabPath) => tabRootOf(routes, tabPath) === root,
        {
          title: input.title,
          literalTitle: input.titleIsLiteral ?? false,
          icon: input.icon,
        },
      );
      if (found) {
        this.paneTree.commitTree(dock, node);
        foundAnywhere = true;
      }
    }
    return foundAnywhere;
  }

  private openHere(input: OpenTabInput): void {
    const routes = this.registry.contentRoutes();
    const path = normalizePath(input.path);
    const root = tabRootOf(routes, path);
    const previewSlot = (input.preview ?? false) && this.features.preview();
    const existing = this.state.openTabRootedAt(routes, root);
    this.closeHooks.set(root, input.onClose);
    if (!existing && this.refineElsewhere(root, input)) {
      return;
    }
    const stored: OpenTab = {
      path: existing?.path ?? path,
      title: input.title,
      literalTitle: input.titleIsLiteral ?? false,
      icon: input.icon,
      onClose: input.onClose,
      preview: existing ? existing.preview : previewSlot,
      pinned: existing ? existing.pinned : false,
      closable: existing ? existing.closable : true,
      ownLabel: true,
    };
    if (previewSlot && !existing) {
      this.replacePreviewSlot(root, stored);
    } else {
      this.state.updateOpen((tabs) =>
        existing
          ? tabs.map((tab) =>
              tabRootOf(routes, tab.path) === root ? stored : tab,
            )
          : [...tabs, stored],
      );
    }
    this.state.navigateTo(stored.path);
  }

  private besideTab(path: string, input: OpenTabInput): PaneTab {
    return {
      path,
      title: input.title,
      ...(input.titleIsLiteral === true && { literalTitle: true }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.preview === true &&
        this.features.preview() && { preview: true }),
    };
  }

  private showHeld(holder: PaneLeaf, root: string, input: OpenTabInput): void {
    const routes = this.registry.contentRoutes();
    const held = holder.tabs.find((tab) => tabRootOf(routes, tab.path) === root);
    if (held === undefined) {
      return;
    }
    const { node } = refineTabTitles(
      this.paneTree.tree(CONTENT_DOCK),
      (leaf) => leaf.id !== holder.id,
      (tabPath) => tabPath === held.path,
      {
        title: input.title,
        literalTitle: input.titleIsLiteral ?? false,
        icon: input.icon,
      },
    );
    this.paneTree.commitTree(
      CONTENT_DOCK,
      setActiveTab(node, holder.id, held.path),
    );
    this.reveal(holder.id);
  }

  private splitOff(tab: PaneTab): void {
    const added: PaneLeaf = {
      kind: 'leaf',
      id: newPaneId(),
      tabs: [tab],
      active: tab.path,
    };
    this.paneTree.commitTree(
      CONTENT_DOCK,
      splitLeafWith(
        this.paneTree.tree(CONTENT_DOCK),
        this.paneTree.primaryId(CONTENT_DOCK),
        'row',
        added,
        'after',
      ),
    );
    this.reveal(added.id);
  }

  private openIn(paneId: string, tab: PaneTab): void {
    const tree = this.paneTree.tree(CONTENT_DOCK);
    const replaced =
      tab.preview === true
        ? findLeaf(tree, paneId)?.tabs.find((held) => held.preview === true)
        : undefined;
    this.paneTree.commitTree(CONTENT_DOCK, openTabInLeaf(tree, paneId, tab));
    if (replaced !== undefined) {
      this.closing.runCloseHook(replaced.path);
    }
    this.reveal(paneId);
  }

  private reveal(paneId: string): void {
    const maximized = this.chrome.maximizedPaneIn(CONTENT_DOCK);
    if (maximized !== null && maximized !== paneId) {
      this.chrome.restore();
    }
    if (this.chrome.isMinimized(CONTENT_DOCK, paneId)) {
      this.chrome.toggleMinimize(CONTENT_DOCK, paneId);
    }
  }
}
