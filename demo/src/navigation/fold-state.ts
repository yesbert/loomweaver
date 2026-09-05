import { signal } from '@angular/core';

const choices = signal<ReadonlyMap<string, boolean>>(new Map());

export const foldState = {
  isOpen(areaKey: string, declared: boolean): boolean {
    return choices().get(areaKey) ?? declared;
  },
  toggle(areaKey: string, declared: boolean): void {
    choices.update((all) => {
      const next = new Map(all);
      next.set(areaKey, !(all.get(areaKey) ?? declared));
      return next;
    });
  },
};
