import { inject, Service } from '@angular/core';
import { SHELL_LAYOUT } from '../../layout/layout';
import { VIEW_PANE_PREFIX, PaneRef } from '../pane/tree/pane-address';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { PaneMoveService } from '../pane/drag/pane-move.service';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { PanelState } from './panel-state';
import { regionOnOtherSide } from '../../layout/layout-queries';
import { MoveAnnouncer, MoveWording } from '../reorder/move-announcer';

const VIEW_MOVE_WORDING: MoveWording = {
  announce: 'panel.viewMove.announce',
  subject: 'view',
  targetLeft: 'panel.viewMove.targetLeft',
  targetRight: 'panel.viewMove.targetRight',
};

@Service()
export class ViewMoveService {
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly panels = inject(PanelState);
  private readonly paneTree = inject(PaneTreeService);
  private readonly paneMove = inject(PaneMoveService);
  private readonly registry = inject(ContributionRegistry);
  private readonly announcer = inject(MoveAnnouncer);

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
    const view = this.registry.views().find((one) => one.id === viewId);
    this.announcer.announce(
      VIEW_MOVE_WORDING,
      { id: viewId, title: view?.title },
      targetRegion,
    );
  }

  moveTab(source: PaneRef, path: string, targetRegion: string): void {
    this.paneMove.moveToStrip(source, path, {
      dock: targetRegion,
      paneId: this.paneTree.primaryId(targetRegion),
    });
    this.panels.expand(targetRegion);
  }

  otherPanel(fromRegion: string): string | undefined {
    return regionOnOtherSide(this.layout, 'panel', fromRegion)?.id;
  }
}
