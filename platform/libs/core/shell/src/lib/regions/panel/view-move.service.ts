import { inject, Service } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoService } from '@jsverse/transloco';
import { SHELL_LAYOUT } from '../../layout/layout';
import { VIEW_PANE_PREFIX } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { PaneMoveService } from '../pane/drag/pane-move.service';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { PanelState } from './panel-state';
import { regionById, regionOnOtherSide } from '../../layout/layout-queries';

@Service()
export class ViewMoveService {
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly panels = inject(PanelState);
  private readonly paneTree = inject(PaneTreeService);
  private readonly paneMove = inject(PaneMoveService);
  private readonly registry = inject(ContributionRegistry);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly transloco = inject(TranslocoService);

  move(viewId: string, targetRegion: string, index?: number): void {
    const path = VIEW_PANE_PREFIX + viewId;
    const source = this.paneTree.sourceOf(path);
    const targetPrimary = this.paneTree.primaryId(targetRegion);
    if (source === null) {
      this.paneTree.insertTab(targetRegion, targetPrimary, path);
    } else if (
      source.dock === targetRegion &&
      source.paneId === targetPrimary
    ) {
      this.paneTree.setActiveTab(targetRegion, targetPrimary, path);
    } else {
      this.paneMove.moveToStrip(
        source,
        path,
        { dock: targetRegion, paneId: targetPrimary },
        index,
      );
    }
    this.panels.expand(targetRegion);
    const title = this.registry
      .views()
      .find((view) => view.id === viewId)?.title;
    void this.announcer.announce(
      this.transloco.translate('panel.viewMove.announce', {
        view: title ? this.transloco.translate(title) : viewId,
        target: this.targetLabel(targetRegion),
      }),
    );
  }

  otherPanel(fromRegion: string): string | undefined {
    return regionOnOtherSide(this.layout, 'panel', fromRegion)?.id;
  }

  private targetLabel(regionId: string): string {
    const dock = regionById(this.layout, regionId)?.dock;
    if (dock === 'left') {
      return this.transloco.translate('panel.viewMove.targetLeft');
    }
    if (dock === 'right') {
      return this.transloco.translate('panel.viewMove.targetRight');
    }
    return regionId;
  }
}
