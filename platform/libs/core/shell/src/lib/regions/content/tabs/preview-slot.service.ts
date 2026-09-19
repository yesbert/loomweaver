import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../../plugin/contribution-registry';
import { ContentReuseStrategy } from '../routing/content-reuse-strategy';
import { matchRoute, tabRootOf } from '../content-path';
import { OpenTab, toPaneTab } from './content-tab-projection';
import { TabCloseHooks } from './tab-close-hooks';
import { OpenTabsService } from './open-tabs.service';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneLeaf } from '../../pane/tree/pane-node';
import { findLeafWhere } from '../../pane/tree/pane-queries';
import { replacePreviewTab } from '../../pane/tree/pane-tabs';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';

@Service()
export class PreviewSlotService {
  private readonly registry = inject(ContributionRegistry);

  private readonly reuse = inject(ContentReuseStrategy);

  private readonly state = inject(OpenTabsService);

  private readonly closeHooks = inject(TabCloseHooks);

  private readonly paneTree = inject(PaneTreeService);

  fill(root: string, slot: OpenTab): void {
    const elsewhere = this.state.openTabs().some((tab) => tab.preview)
      ? null
      : this.previewPaneElsewhere();
    if (elsewhere === null) {
      this.replaceHere(root, slot);
    } else {
      this.replaceIn(elsewhere, slot);
    }
  }

  private previewPaneElsewhere(): PaneLeaf | null {
    const primary = this.paneTree.primaryId(CONTENT_DOCK);
    return findLeafWhere(
      this.paneTree.tree(CONTENT_DOCK),
      (leaf) => leaf.id !== primary && leaf.tabs.some((tab) => tab.preview),
    );
  }

  private replaceHere(root: string, slot: OpenTab): void {
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

  private replaceIn(pane: PaneLeaf, slot: OpenTab): void {
    const routes = this.registry.contentRoutes();
    const previous = pane.tabs.find((tab) => tab.preview);
    const shown = this.shownContent();
    this.paneTree.commitTree(
      CONTENT_DOCK,
      replacePreviewTab(
        this.paneTree.tree(CONTENT_DOCK),
        pane.id,
        toPaneTab(slot),
      ),
    );
    this.paneTree.focusPane(CONTENT_DOCK, pane.id, shown);
    if (previous !== undefined) {
      this.closeHooks.runSafely(
        this.closeHooks.take(tabRootOf(routes, previous.path)),
      );
    }
  }

  private shownContent(): string {
    const root = this.state.activeTabRoot();
    return matchRoute(this.registry.contentRoutes(), root) ? root : '';
  }
}
