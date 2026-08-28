import { inject, Service } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { TranslocoService } from '@jsverse/transloco';
import { SHELL_LAYOUT } from '../../layout/layout';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { RailItemsService } from './rail-items.service';

@Service()
export class RailMoveService {
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly items = inject(RailItemsService);
  private readonly registry = inject(ContributionRegistry);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly transloco = inject(TranslocoService);

  move(itemId: string, targetRegion: string): void {
    this.items.show(itemId, targetRegion);
    const title = this.registry
      .railItems()
      .find((item) => item.id === itemId)?.title;
    void this.announcer.announce(
      this.transloco.translate('rail.move.announce', {
        item: title ? this.transloco.translate(title) : itemId,
        target: this.targetLabel(targetRegion),
      }),
    );
  }

  otherRail(fromRegion: string): string | undefined {
    const from = this.layout.regions.find((region) => region.id === fromRegion);
    if (!from) {
      return undefined;
    }
    return this.layout.regions.find(
      (region) =>
        region.type === 'rail' &&
        region.id !== fromRegion &&
        region.dock !== from.dock,
    )?.id;
  }

  railOn(dock: 'left' | 'right', fromRegion: string): string | undefined {
    return this.layout.regions.find(
      (region) =>
        region.type === 'rail' &&
        region.dock === dock &&
        region.id !== fromRegion,
    )?.id;
  }

  private targetLabel(regionId: string): string {
    const dock = this.layout.regions.find((r) => r.id === regionId)?.dock;
    if (dock === 'left') {
      return this.transloco.translate('rail.move.targetLeft');
    }
    if (dock === 'right') {
      return this.transloco.translate('rail.move.targetRight');
    }
    return regionId;
  }
}
