import { DOCUMENT, inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { MenuService } from '../../../menu/menu.service';
import { MENU_ANCHOR_GAP } from '../../../elements/menu/lw-menu.element';
import { ContributionRegistry } from '../../../contributions/contribution-registry';
import { MoveAnnouncer, MovedEntry } from '../../reorder/move-announcer';
import { CONTENT_DOCK, PaneRef } from '../tree/pane-address';
import { PaneLeaf, activeTab } from '../tree/pane-node';
import { leavesOf } from '../tree/pane-queries';
import { PaneTreeService } from '../tree/pane-tree.service';
import { tabIdIn } from '../chrome/strip-tab';
import {
  overlayTabTitle,
  PaneLabel,
  paneLabelOf,
  resolveTitle,
} from '../chrome/tab-label';
import { PaneFocus } from '../pane-focus';
import { PaneMoveService, stripIdOf } from './pane-move.service';

interface MoveTarget {
  readonly pane: PaneRef;
  readonly position: number;
  readonly label: PaneLabel;
}

@Service()
export class TabMoves {
  private readonly paneTree = inject(PaneTreeService);
  private readonly paneMove = inject(PaneMoveService);
  private readonly paneFocus = inject(PaneFocus);
  private readonly announcer = inject(MoveAnnouncer);
  private readonly menu = inject(MenuService);
  private readonly registry = inject(ContributionRegistry);
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  pickTarget(path: string, source: PaneRef): void {
    const targets = this.targetsFrom(source);
    const tab = this.document.querySelector<HTMLElement>(
      `#${CSS.escape(tabIdIn(stripIdOf(source), path))}`,
    );
    const anchor = tab?.getBoundingClientRect();
    this.menu.openList(
      targets.map((target) => ({
        key: target.pane.paneId,
        label: () => this.nameOf(target),
      })),
      { x: anchor?.left ?? 0, y: (anchor?.bottom ?? 0) + MENU_ANCHOR_GAP },
      (paneId) => {
        const target = targets.find((one) => one.pane.paneId === paneId);
        if (target) {
          void this.moveTo(path, source, target);
        }
      },
      tab ?? undefined,
    );
  }

  async moveTo(
    path: string,
    source: PaneRef,
    target: MoveTarget,
  ): Promise<boolean> {
    const subject = this.subjectOf(path, source);
    const moved = await this.paneMove.moveToStrip(source, path, target.pane);
    if (moved) {
      this.announcer.announceTab('content.tabMove.announce', subject, {
        position: target.position,
      });
      this.paneFocus.settleOnTab(path, target.pane);
    }
    return moved;
  }

  async splitOut(
    path: string,
    orientation: 'row' | 'column',
    pane?: PaneRef,
  ): Promise<boolean> {
    const source = pane ?? this.addressPane();
    const subject = this.subjectOf(path, source);
    const moved = await this.paneMove.splitTabOut(path, orientation, pane);
    if (moved) {
      this.announcer.announceTab('content.tabMove.announceNew', subject);
      this.paneFocus.settleOnTab(path, source);
    }
    return moved;
  }

  targetsFrom(source: PaneRef): MoveTarget[] {
    return leavesOf(this.paneTree.tree(CONTENT_DOCK))
      .map((leaf, index) => ({
        pane: { dock: CONTENT_DOCK, paneId: leaf.id },
        position: index + 1,
        label: this.labelOf(leaf),
      }))
      .filter(
        (target) =>
          target.pane.dock !== source.dock ||
          target.pane.paneId !== source.paneId,
      );
  }

  private nameOf(target: MoveTarget): string {
    return this.transloco.translate('content.tabMove.pane', {
      position: target.position,
      title: resolveTitle(target.label, (key) => this.transloco.translate(key)),
    });
  }

  private labelOf(leaf: PaneLeaf): PaneLabel {
    const tab = activeTab(leaf);
    const base = paneLabelOf(this.registry, tab?.path ?? '');
    return tab ? overlayTabTitle(tab, base) : base;
  }

  private subjectOf(path: string, source: PaneRef): MovedEntry {
    const leaves = leavesOf(this.paneTree.tree(source.dock));
    const tab = leaves
      .find((leaf) => leaf.id === source.paneId)
      ?.tabs.find((one) => one.path === path);
    const label = tab
      ? overlayTabTitle(tab, paneLabelOf(this.registry, path))
      : paneLabelOf(this.registry, path);
    return { id: path, title: label.title, literalTitle: label.literalTitle };
  }

  private addressPane(): PaneRef {
    return {
      dock: CONTENT_DOCK,
      paneId: this.paneTree.primaryId(CONTENT_DOCK),
    };
  }
}
