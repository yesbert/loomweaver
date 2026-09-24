import { inject, Service, signal } from '@angular/core';
import { PaneTreeService } from '../tree/pane-tree.service';
import { findLeaf } from '../tree/pane-queries';
import { PaneRef } from '../tree/pane-address';

@Service()
export class PaneChromeService {
  private readonly paneTree = inject(PaneTreeService);
  private readonly maximized = signal<PaneRef | null>(null);
  private readonly minimizedPanes = signal<ReadonlySet<string>>(new Set());

  isMaximized(dock: string, paneId: string): boolean {
    return this.maximizedPaneIn(dock) === paneId;
  }

  maximizedPaneIn(dock: string): string | null {
    const current = this.maximized();
    return current?.dock === dock &&
      findLeaf(this.paneTree.tree(dock), current.paneId) !== null
      ? current.paneId
      : null;
  }

  toggleMaximize(dock: string, paneId: string): void {
    this.maximized.update((current) =>
      this.isMaximized(dock, paneId) && current ? null : { dock, paneId },
    );
  }

  endMaximize(): void {
    this.maximized.set(null);
  }

  isMinimized(dock: string, paneId: string): boolean {
    return this.minimizedPanes().has(paneKey(dock, paneId));
  }

  toggleMinimize(dock: string, paneId: string): void {
    this.minimizedPanes.update((current) => {
      const next = new Set(current);
      const id = paneKey(dock, paneId);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  clearMinimized(dock: string): void {
    const prefix = `${dock}:`;
    const current = this.minimizedPanes();
    if ([...current].every((id) => !id.startsWith(prefix))) {
      return;
    }
    this.minimizedPanes.set(
      new Set([...current].filter((id) => !id.startsWith(prefix))),
    );
  }
}

function paneKey(dock: string, paneId: string): string {
  return `${dock}:${paneId}`;
}
