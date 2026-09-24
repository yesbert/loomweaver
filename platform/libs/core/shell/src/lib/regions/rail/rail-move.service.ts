import { inject, Service } from '@angular/core';
import { SHELL_LAYOUT } from '../../layout/layout';
import { ContributionRegistry } from '../../contributions/contribution-registry';
import { RailItemsService } from './rail-items.service';
import { regionOnOtherSide, regionOnSide } from '../../layout/layout-queries';
import { MoveAnnouncer, MoveWording } from '../reorder/move-announcer';

const RAIL_MOVE_WORDING: MoveWording = {
  announce: 'rail.move.announce',
  subject: 'item',
  targetLeft: 'rail.move.targetLeft',
  targetRight: 'rail.move.targetRight',
};

@Service()
export class RailMoveService {
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly items = inject(RailItemsService);
  private readonly registry = inject(ContributionRegistry);
  private readonly announcer = inject(MoveAnnouncer);

  move(itemId: string, targetRegion: string): void {
    this.items.place(itemId, targetRegion);
    const item = this.registry.railItems().find((one) => one.id === itemId);
    this.announcer.announce(
      RAIL_MOVE_WORDING,
      { id: itemId, title: item?.title },
      targetRegion,
    );
  }

  otherRail(fromRegion: string): string | undefined {
    return regionOnOtherSide(this.layout, 'rail', fromRegion)?.id;
  }

  railOn(side: 'left' | 'right', fromRegion: string): string | undefined {
    return regionOnSide(this.layout, 'rail', side, fromRegion)?.id;
  }
}
