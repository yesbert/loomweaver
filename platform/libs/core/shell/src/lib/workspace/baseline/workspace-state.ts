import { KeyValueStore } from '../../persistence/key-value-store';
import { readStoredValue } from '../../persistence/stored-values/hydrate';
import { workspaceScopedKey } from '../active-workspace.service';

export const WORKSPACES_KEY = 'lw.shell.workspaces';

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly baseline: Readonly<Record<string, string>>;
  readonly origin?: string;
}

export function parseWorkspaces(raw: string | undefined): Workspace[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (workspace): workspace is Workspace =>
        !!workspace &&
        typeof (workspace as Workspace).id === 'string' &&
        typeof (workspace as Workspace).name === 'string' &&
        typeof (workspace as Workspace).baseline === 'object' &&
        (workspace as Workspace).baseline !== null &&
        !Array.isArray((workspace as Workspace).baseline),
    );
  } catch {
    return [];
  }
}

export async function readWorkspaceState(
  store: KeyValueStore,
  scopedKey: (key: string) => string,
  keys: readonly string[],
): Promise<Record<string, string>> {
  const state: Record<string, string> = {};
  for (const key of keys) {
    const raw = await readStoredValue(store, scopedKey(key));
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
