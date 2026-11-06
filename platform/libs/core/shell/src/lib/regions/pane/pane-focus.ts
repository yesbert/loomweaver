import {
  afterNextRender,
  DOCUMENT,
  inject,
  Injector,
  Service,
} from '@angular/core';
import { PaneRef } from './tree/pane-address';
import { findLeaf } from './tree/pane-queries';
import { PaneTreeService } from './tree/pane-tree.service';
import { stripIdOf } from './drag/pane-move.service';
import { panelIdIn } from './chrome/strip-tab';

export const MAIN_CONTENT_ID = 'lw-main-content';

export function paneKeyOf(pane: PaneRef): string {
  return stripIdOf(pane);
}

export function minimizedIdOf(pane: PaneRef): string {
  return `${stripIdOf(pane)}:minimized`;
}

@Service()
export class PaneFocus {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly paneTree = inject(PaneTreeService);

  settleOn(pane: PaneRef): void {
    afterNextRender(
      {
        read: () => {
          if (this.free(pane)) {
            this.focusNow(this.remaining(pane));
          }
        },
      },
      { injector: this.injector },
    );
  }

  settleOnTab(path: string, from: PaneRef, fallback: PaneRef = from): void {
    afterNextRender(
      {
        read: () => {
          if (this.free(from)) {
            this.focusNow(
              this.paneTree.sourceOf(path) ?? this.remaining(fallback),
              path,
            );
          }
        },
      },
      { injector: this.injector },
    );
  }

  private remaining(pane: PaneRef): PaneRef {
    return findLeaf(this.paneTree.tree(pane.dock), pane.paneId)
      ? pane
      : { dock: pane.dock, paneId: this.paneTree.primaryId(pane.dock) };
  }

  private focusNow(pane: PaneRef, path?: string): void {
    const strip = this.byId(stripIdOf(pane));
    const named =
      path === undefined
        ? null
        : strip?.querySelector<HTMLElement>(
            `[role="tab"][data-tab-path="${CSS.escape(path)}"]`,
          );
    const tab =
      named ??
      strip?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ??
      strip?.querySelector<HTMLElement>('[role="tab"]');
    const target =
      tab ??
      this.byId(this.bodyIdOf(pane)) ??
      this.byId(minimizedIdOf(pane));
    target?.focus();
  }

  private free(from: PaneRef): boolean {
    const focused = this.document.activeElement;
    if (focused === null || focused === this.document.body) {
      return true;
    }
    const pane = this.document.querySelector(
      `[data-pane="${CSS.escape(paneKeyOf(from))}"]`,
    );
    return (
      pane?.contains(focused) === true ||
      focused === this.byId(minimizedIdOf(from))
    );
  }

  private byId(id: string): HTMLElement | null {
    return this.document.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
  }

  private bodyIdOf(pane: PaneRef): string {
    return this.paneTree.carriesAddress(pane)
      ? MAIN_CONTENT_ID
      : panelIdIn(stripIdOf(pane));
  }
}
