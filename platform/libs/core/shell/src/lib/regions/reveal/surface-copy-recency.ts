import { effect, inject, Injector, Service } from '@angular/core';
import { isViewPanePath, PaneRef } from '../pane/tree/pane-address';
import { leafPath } from '../pane/tree/pane-node';
import { leavesOf } from '../pane/tree/pane-queries';
import { PaneTreeService } from '../pane/tree/pane-tree.service';
import { isContainerDock } from '../pane/container/container-children';
import { stripIdOf } from '../pane/drag/pane-move.service';
import { ContentTabsService } from '../content/tabs/content-tabs.service';

interface CopyStamp {
  readonly since: number;
  readonly until: number | null;
}

type Recency = readonly [current: number, moment: number];

const NEVER: Recency = [0, 0];

function copyKey(pane: PaneRef, path: string): string {
  return `${stripIdOf(pane)}\0${path}`;
}

function recencyOf(stamp: CopyStamp | undefined): Recency {
  if (stamp === undefined) {
    return NEVER;
  }
  return stamp.until === null ? [2, stamp.since] : [1, stamp.until];
}

function compareRecency(a: Recency, b: Recency): number {
  return a[0] - b[0] || a[1] - b[1];
}

@Service()
export class SurfaceCopyRecency {
  private readonly paneTree = inject(PaneTreeService);
  private readonly tabs = inject(ContentTabsService);
  private readonly injector = inject(Injector);
  private readonly stamps = new Map<string, CopyStamp>();
  private moment = 0;

  start(): void {
    effect(() => this.record(this.currentCopies()), {
      injector: this.injector,
    });
  }

  mostRecent(path: string, copies: readonly PaneRef[]): readonly PaneRef[] {
    this.record(this.currentCopies());
    const ranked = copies.map((copy) => ({
      copy,
      recency: recencyOf(this.stamps.get(copyKey(copy, path))),
    }));
    let best = NEVER;
    for (const { recency } of ranked) {
      if (compareRecency(recency, best) > 0) {
        best = recency;
      }
    }
    return ranked
      .filter((entry) => compareRecency(entry.recency, best) === 0)
      .map((entry) => entry.copy);
  }

  private currentCopies(): ReadonlySet<string> {
    const addressView = this.tabs.activeViewPath();
    const current = new Set<string>();
    for (const [dock, tree] of Object.entries(this.paneTree.dockTrees())) {
      if (isContainerDock(dock)) {
        continue;
      }
      for (const leaf of leavesOf(tree)) {
        const pane = { dock, paneId: leaf.id };
        const path = this.paneTree.carriesAddress(pane)
          ? addressView
          : leafPath(leaf);
        if (path && isViewPanePath(path)) {
          current.add(copyKey(pane, path));
        }
      }
    }
    return current;
  }

  private record(current: ReadonlySet<string>): void {
    this.moment += 1;
    for (const [key, stamp] of this.stamps) {
      if (stamp.until === null && !current.has(key)) {
        this.stamps.set(key, { ...stamp, until: this.moment });
      }
    }
    for (const key of current) {
      if (this.stamps.get(key)?.until !== null) {
        this.stamps.set(key, { since: this.moment, until: null });
      }
    }
  }
}
