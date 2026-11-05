import { KeyValueStore } from '../../persistence/key-value-store';
import { readStoredValue } from '../../persistence/stored-values/hydrate';
import { workspaceScopedKey } from '../active-workspace.service';

export async function readWorkspaceState(
  store: KeyValueStore,
  scopedKey: (key: string) => string,
  keys: readonly string[],
): Promise<Record<string, string>> {
  const read = await Promise.all(
    keys.map((key) => readStoredValue(store, scopedKey(key))),
  );
  const state: Record<string, string> = {};
  for (const [position, key] of keys.entries()) {
    const raw = read[position];
    if (raw != null) {
      state[key] = raw;
    }
  }
  return state;
}

export function writeWorkspaceState(
  store: KeyValueStore,
  id: string,
  state: Readonly<Record<string, string>>,
  keys: readonly string[],
): void {
  for (const key of keys) {
    const scoped = workspaceScopedKey(key, id);
    const value = state[key];
    if (value === undefined) {
      void store.delete(scoped);
    } else {
      void store.set(scoped, value);
    }
  }
}
