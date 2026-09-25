export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storeBestEffort(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}
