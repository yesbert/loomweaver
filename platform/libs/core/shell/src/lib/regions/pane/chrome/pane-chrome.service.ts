import { inject, Service, signal } from '@angular/core';
import { PaneTreeService } from '../tree/pane-tree.service';
import { findLeaf } from '../tree/pane-queries';

@Service()
export class PaneChromeService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly max = signal<{ dock: string; paneId: string } | null>(null);
  private readonly min = signal<ReadonlySet<string>>(new Set());

  isMaximized(dock: string, paneId: string): boolean {
    return this.maximizedPaneIn(dock) === paneId;
  }

  maximizedPaneIn(dock: string): string | null {
    const current = this.max();
    return current?.dock === dock &&
      findLeaf(this.paneTree.tree(dock), current.paneId) !== null
      ? current.paneId
      : null;
  }

  toggleMaximize(dock: string, paneId: string): void {
    this.max.update((current) =>
      this.isMaximized(dock, paneId) && current ? null : { dock, paneId },
    );
  }

  restore(): void {
    this.max.set(null);
  }

  isMinimized(dock: string, paneId: string): boolean {
    return this.min().has(key(dock, paneId));
  }

  toggleMinimize(dock: string, paneId: string): void {
    this.min.update((current) => {
      const next = new Set(current);
      const id = key(dock, paneId);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  clearMinimized(dock: string): void {
    const prefix = `${dock}:`;
    const current = this.min();
    if ([...current].every((id) => !id.startsWith(prefix))) {
      return;
    }
    this.min.set(new Set([...current].filter((id) => !id.startsWith(prefix))));
  }
}

function key(dock: string, paneId: string): string {
  return `${dock}:${paneId}`;
}
