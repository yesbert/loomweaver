import { KeyValueStore } from './key-value-store';

export function hydrateAsync(
  store: KeyValueStore,
  key: string,
  apply: (raw: string | undefined) => void,
  onSettled?: (loaded: boolean) => void,
): void {
  if (store.peek) {
    onSettled?.(true);
    return;
  }
  void store
    .get(key)
    .then((raw) => {
      apply(raw);
      onSettled?.(true);
    })
    .catch(() => onSettled?.(false));
}

export async function readStoredValue(
  store: KeyValueStore,
  key: string,
): Promise<string | undefined> {
  if (store.peek) {
    return store.peek(key);
  }
  return store.get(key).catch(() => undefined);
}
