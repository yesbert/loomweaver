import type { LwStateApi, LwStateHost } from './surface-kit.frame';

interface Watched {
  value: unknown;
  loaded: boolean;
  readonly listeners: ((value: unknown, loaded: boolean) => void)[];
}

export function createState(): LwStateApi & {
  connect(host: LwStateHost): void;
} {
  const watched = new Map<string, Watched>();
  let host: LwStateHost | undefined;

  const entryFor = (key: string): Watched => {
    const existing = watched.get(key);
    if (existing) {
      return existing;
    }
    const entry: Watched = { value: undefined, loaded: false, listeners: [] };
    watched.set(key, entry);
    host?.stateWatch(key);
    return entry;
  };

  return {
    connect(next: LwStateHost): void {
      host = next;
      for (const key of watched.keys()) {
        next.stateWatch(key);
      }
    },
    apply(key: string, value: unknown, loaded: boolean): void {
      const entry = entryFor(key);
      entry.value = value;
      entry.loaded = loaded;
      for (const listener of entry.listeners) {
        listener(value, loaded);
      }
    },
    watch<T>(key: string) {
      const entry = entryFor(key);
      return {
        value: () => entry.value as T | undefined,
        loaded: () => entry.loaded,
        set: (next: T) => {
          entry.value = next;
          host?.stateSet(key, next);
        },
        clear: () => {
          entry.value = undefined;
          host?.stateClear(key);
        },
        dispose: () => {
          watched.delete(key);
          host?.stateUnwatch(key);
        },
        onChange: (
          listener: (value: T | undefined, loaded: boolean) => void,
        ) => {
          entry.listeners.push(
            listener as (value: unknown, loaded: boolean) => void,
          );
        },
      };
    },
  };
}
