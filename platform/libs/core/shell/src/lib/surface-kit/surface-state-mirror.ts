import type { LwStateApi, LwStateHost } from './surface-kit.frame';

interface Watched {
  value: unknown;
  loaded: boolean;
  readonly listeners: ((value: unknown, loaded: boolean) => void)[];
}

interface EarlyWrite {
  readonly cleared: boolean;
  readonly value?: unknown;
}

function deliver(
  host: LwStateHost,
  key: string,
  write: EarlyWrite,
  watching: boolean,
): void {
  if (!watching) {
    host.stateWatch(key);
  }
  if (write.cleared) {
    host.stateClear(key);
  } else {
    host.stateSet(key, write.value);
  }
  if (!watching) {
    host.stateUnwatch(key);
  }
}

export function createState(): LwStateApi & {
  connect(host: LwStateHost): void;
} {
  const watched = new Map<string, Watched>();
  const early = new Map<string, EarlyWrite>();
  let host: LwStateHost | undefined;

  const write = (key: string, next: EarlyWrite): void => {
    if (host) {
      deliver(host, key, next, true);
    } else {
      early.set(key, next);
    }
  };

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
      for (const [key, pending] of early) {
        deliver(next, key, pending, watched.has(key));
      }
      early.clear();
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
          write(key, { cleared: false, value: next });
        },
        clear: () => {
          entry.value = undefined;
          write(key, { cleared: true });
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
