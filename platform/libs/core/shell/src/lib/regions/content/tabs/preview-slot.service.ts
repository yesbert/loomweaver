import { inject, Service } from '@angular/core';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { declaringRoute, tabRootOf } from '../content-path';
import { OpenTab, toPaneTab } from './content-tab-projection';
import { ContentTabState } from './content-tab-state';
import { CONTENT_DOCK } from '../../pane/tree/pane-address';
import { PaneLeaf } from '../../pane/tree/pane-node';
import { findLeafWhere } from '../../pane/tree/pane-queries';
import { replacePreviewTab } from '../../pane/tree/pane-tabs';
import { PaneTreeService } from '../../pane/tree/pane-tree.service';

@Service()
export class PreviewSlotService {
  private readonly registry = inject(ContributionRegistry);

  private readonly state = inject(ContentTabState);

  private readonly paneTree = inject(PaneTreeService);

  fillWith(slot: OpenTab): void {
    const elsewhere = this.state.openTabs().some((tab) => tab.preview)
      ? null
      : this.previewPaneElsewhere();
    if (elsewhere === null) {
      this.replaceHere(slot);
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

  private replaceHere(slot: OpenTab): void {
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
  }

  private replaceIn(pane: PaneLeaf, slot: OpenTab): void {
    const shown = this.shownContent();
    this.paneTree.commit(
      CONTENT_DOCK,
      replacePreviewTab(
        this.paneTree.tree(CONTENT_DOCK),
        pane.id,
        toPaneTab(slot),
      ),
    );
    this.paneTree.focusPane(CONTENT_DOCK, pane.id, shown);
  }

  private shownContent(): string {
    const root = this.state.activeTabRoot();
    return declaringRoute(this.registry.contentRoutes(), root) ? root : '';
  }
}
