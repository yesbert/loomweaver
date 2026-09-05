import { signal } from '@angular/core';

const collapsed = signal<ReadonlySet<string>>(new Set());

export const foldState = {
  isOpen(areaId: string): boolean {
    return !collapsed().has(areaId);
  },
  toggle(areaId: string): void {
    collapsed.update((all) => {
      const next = new Set(all);
      if (next.has(areaId)) {
        next.delete(areaId);
      } else {
        next.add(areaId);
      }
      return next;
    });
  },
};
