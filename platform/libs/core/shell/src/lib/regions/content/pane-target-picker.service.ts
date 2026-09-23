import { inject, Service } from '@angular/core';
import { ContainerSpec } from '@loomweaver/plugin-sdk';
import { ContributionRegistry } from '../../plugin/contribution-registry';
import { AuthContext } from '../../auth/auth-context';
import { MENU_ANCHOR_GAP, MenuService } from '../../menu/menu.service';
import { LeftOutChildren } from '../pane/container/left-out-children';
import {
  PaneTarget,
  containerChildTargets,
  offRouterPaneTargets,
  paneTargetEntries,
  routerPaneTargets,
} from './pane-targets';

@Service()
export class PaneTargetPicker {
  private readonly registry = inject(ContributionRegistry);
  private readonly auth = inject(AuthContext);
  private readonly menu = inject(MenuService);
  private readonly leftOut = inject(LeftOutChildren);

  openForNavigation(anchor: HTMLElement, onPick: (path: string) => void): void {
    this.present(routerPaneTargets(this.registry, this.auth), anchor, onPick);
  }

  openForHosting(anchor: HTMLElement, onPick: (path: string) => void): void {
    this.present(
      offRouterPaneTargets(this.registry, this.auth),
      anchor,
      onPick,
    );
  }

  openForChildren(
    anchor: HTMLElement,
    spec: ContainerSpec | undefined,
    onPick: (path: string) => void,
  ): void {
    this.present(
      containerChildTargets(this.registry, this.auth, spec).filter(
        (target) => !this.leftOut.hides(target.path),
      ),
      anchor,
      onPick,
    );
  }

  private present(
    targets: readonly PaneTarget[],
    anchor: HTMLElement,
    onPick: (path: string) => void,
  ): void {
    const rect = anchor.getBoundingClientRect();
    const entries = paneTargetEntries(targets);
    this.menu.openList(
      entries,
      { x: rect.left, y: rect.bottom + MENU_ANCHOR_GAP },
      onPick,
      anchor,
    );
  }
}
