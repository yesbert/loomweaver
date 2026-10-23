import { LiveAnnouncer } from '@angular/cdk/a11y';
import { inject, Service } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SHELL_LAYOUT } from '../../layout/layout';
import { regionById } from '../../layout/layout-queries';

export interface MoveWording {
  readonly announce: string;
  readonly subject: string;
  readonly targetLeft: string;
  readonly targetRight: string;
}

export interface MovedEntry {
  readonly id: string;
  readonly title?: string;
  readonly literalTitle?: boolean;
}

@Service()
export class MoveAnnouncer {
  private readonly layout = inject(SHELL_LAYOUT);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly transloco = inject(TranslocoService);

  announce(
    wording: MoveWording,
    moved: MovedEntry,
    targetRegion: string,
  ): void {
    void this.announcer.announce(
      this.transloco.translate(wording.announce, {
        [wording.subject]: this.nameOf(moved),
        target: this.targetLabel(wording, targetRegion),
      }),
    );
  }

  private nameOf(moved: MovedEntry): string {
    if (!moved.title) {
      return moved.id;
    }
    return moved.literalTitle
      ? moved.title
      : this.transloco.translate(moved.title);
  }

  private targetLabel(wording: MoveWording, regionId: string): string {
    const side = regionById(this.layout, regionId)?.dock;
    if (side === 'left') {
      return this.transloco.translate(wording.targetLeft);
    }
    if (side === 'right') {
      return this.transloco.translate(wording.targetRight);
    }
    return regionId;
  }
}
