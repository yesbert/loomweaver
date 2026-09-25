export interface CrossTabHooks {
  announce(key: string): void;
}

export interface CrossTabLink {
  readonly key: string;
  refresh(): void;
}

export interface PersistedChoice {
  read(): string | null;
  write(value: string): void;
  connectSync(hooks: CrossTabHooks, refresh: () => void): CrossTabLink;
}

export function persistedChoice(key: string): PersistedChoice {
  let announce: ((key: string) => void) | undefined;
  return {
    read: () => whereStorageAllows(() => localStorage.getItem(key)) ?? null,
    write: (value) => {
      whereStorageAllows(() => localStorage.setItem(key, value));
      announce?.(key);
    },
    connectSync: (hooks, refresh) => {
      announce = hooks.announce;
      return { key, refresh };
    },
  };
}

function whereStorageAllows<T>(access: () => T): T | undefined {
  try {
    return access();
  } catch {
    return undefined;
  }
}
