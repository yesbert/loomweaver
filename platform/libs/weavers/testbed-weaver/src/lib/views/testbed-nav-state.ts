import { signal } from '@angular/core';

const DEFAULTS = ['Item C', 'Item A', 'Item B'];
const items = signal([...DEFAULTS]);

export const testbedNavState = {
  items: items.asReadonly(),
  add: () => items.update((list) => [...list, `Item ${list.length + 1}`]),
  sort: () =>
    items.update((list) => [...list].sort((a, b) => a.localeCompare(b))),
  reset: () => items.set([...DEFAULTS]),
};
