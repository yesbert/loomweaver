import { Service, signal } from '@angular/core';

@Service()
export class PaneChromeService {
  private readonly max = signal<{ dock: string; paneId: string } | null>(null);
  private readonly min = signal<ReadonlySet<string>>(new Set());

  isMaximized(dock: string, paneId: string): boolean {
    const current = this.max();
    return (
      current !== null && current.dock === dock && current.paneId === paneId
    );
  }

  maximizedPaneIn(dock: string): string | null {
    const current = this.max();
    return current?.dock === dock ? current.paneId : null;
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
