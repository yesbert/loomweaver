import { readStored, storeBestEffort } from '../best-effort-storage';
import { DEFAULT_LOOK, lookById, type DemoLook } from './looks';

const STORAGE_KEY = 'demo.look';

export const activeLook: DemoLook = lookById(readStored(STORAGE_KEY) ?? DEFAULT_LOOK.id);

export function markLookOnDocument(): void {
  document.documentElement.classList.add(`look-${activeLook.id}`);
}

export function switchLook(id: string): void {
  if (id === activeLook.id) {
    return;
  }
  storeBestEffort(STORAGE_KEY, id);
  location.reload();
}
