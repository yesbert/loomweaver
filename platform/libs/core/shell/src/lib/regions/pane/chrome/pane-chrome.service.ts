import { computed, inject, Service, signal } from '@angular/core';
import { RetainedViewStash } from '../retention/retained-view-stash';
import { isKeyOfDock, isKeyOfPane } from '../retention/retention-keys';
import { PaneTreeService } from '../tree/pane-tree.service';
import { findLeaf } from '../tree/pane-queries';
import { PaneRef } from '../tree/pane-address';

interface PaneChrome {
  readonly arrangement: number;
  readonly maximized: PaneRef | null;
  readonly minimized: ReadonlySet<string>;
}

@Service()
export class PaneChromeService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly stash = inject(RetainedViewStash);
  private readonly kept = signal<PaneChrome>(untouched(0));
  private readonly chrome = computed(() => {
    const arrangement = this.paneTree.arrangement();
    const kept = this.kept();
    return kept.arrangement === arrangement ? kept : untouched(arrangement);
  });

  isMaximized(dock: string, paneId: string): boolean {
    return this.maximizedPaneIn(dock) === paneId;
  }

  maximizedPaneIn(dock: string): string | null {
    const current = this.chrome().maximized;
    return current?.dock === dock &&
      findLeaf(this.paneTree.tree(dock), current.paneId) !== null
      ? current.paneId
      : null;
  }

  toggleMaximize(dock: string, paneId: string): void {
    this.maximize(this.isMaximized(dock, paneId) ? null : { dock, paneId });
  }

  endMaximize(): void {
    this.maximize(null);
  }

  isMinimized(dock: string, paneId: string): boolean {
    return this.chrome().minimized.has(paneKey(dock, paneId));
  }

  toggleMinimize(dock: string, paneId: string): void {
    const minimized = new Set(this.chrome().minimized);
    const id = paneKey(dock, paneId);
    if (!minimized.delete(id)) {
      this.stash.evacuate((key) => isKeyOfPane(key, dock, paneId));
      minimized.add(id);
    }
    this.kept.set({ ...this.chrome(), minimized });
  }

  clearMinimized(dock: string): void {
    const prefix = `${dock}:`;
    const current = this.chrome().minimized;
    if ([...current].every((id) => !id.startsWith(prefix))) {
      return;
    }
    this.kept.set({
      ...this.chrome(),
      minimized: new Set([...current].filter((id) => !id.startsWith(prefix))),
    });
  }

  private maximize(maximized: PaneRef | null): void {
    const before = this.chrome().maximized;
    if (before === maximized) {
      return;
    }
    for (const dock of new Set([before?.dock, maximized?.dock])) {
      if (dock !== undefined) {
        this.stash.evacuate((key) => isKeyOfDock(key, dock));
      }
    }
    this.kept.set({ ...this.chrome(), maximized });
  }
}

function untouched(arrangement: number): PaneChrome {
  return { arrangement, maximized: null, minimized: new Set() };
}

function paneKey(dock: string, paneId: string): string {
  return `${dock}:${paneId}`;
}
