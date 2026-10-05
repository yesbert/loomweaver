import { LocalStorageStore } from '@loomweaver/shell';
import { DEFAULT_LOOK, lookById, type DemoLook } from './looks';

const STORAGE_KEY = 'demo.look';

const store = new LocalStorageStore();

export const activeLook: DemoLook = lookById(store.peek(STORAGE_KEY) ?? DEFAULT_LOOK.id);

export function markLookOnDocument(): void {
  document.documentElement.classList.add(`look-${activeLook.id}`);
}

export function switchLook(id: string): void {
  if (id === activeLook.id) {
    return;
  }
  void store.set(STORAGE_KEY, id);
  location.reload();
}
