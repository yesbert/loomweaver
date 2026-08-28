import { DEFAULT_LOOK, lookById, type DemoLook } from './looks';

const STORAGE_KEY = 'demo.look';

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function rememberBestEffort(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    return;
  }
}

export const activeLook: DemoLook = lookById(readStored() ?? DEFAULT_LOOK.id);

export function markLookOnDocument(): void {
  document.documentElement.classList.add(`look-${activeLook.id}`);
}

export function switchLook(id: string): void {
  if (id === activeLook.id) {
    return;
  }
  rememberBestEffort(id);
  location.reload();
}
