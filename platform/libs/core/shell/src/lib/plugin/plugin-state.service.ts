import { inject, isDevMode, Service, signal, WritableSignal } from '@angular/core';
import { PluginState, StateHandle } from '@loomweaver/plugin-sdk';
import { WORKING_STATE_STORE } from '../persistence/working-state-store';
import { hydrateAsync, readStoredValue } from '../persistence/hydrate';
import { StateSyncService } from '../persistence/state-sync.service';

const STORAGE_PREFIX = 'lw.plugin-state:';
const INDEX_PREFIX = 'lw.plugin-state-keys:';
const SAVE_DEBOUNCE_MS = 400;
const MAX_VALUE_BYTES = 64 * 1024;
const MAX_KEYS = 64;

function parseBlob(raw: string | undefined): unknown {
  if (!raw) {
    return undefined;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function parseKeys(raw: string | undefined): string[] {
  const parsed = parseBlob(raw);
  return Array.isArray(parsed)
    ? parsed.filter((key): key is string => typeof key === 'string')
    : [];
}

interface Entry {
  readonly storageKey: string;
  readonly pluginId: string;
  readonly value: WritableSignal<unknown>;
  readonly loaded: WritableSignal<boolean>;
  watchers: number;
  pending: string | undefined;
  timer: ReturnType<typeof setTimeout> | undefined;
}

@Service()
export class PluginStateService {
  private readonly store = inject(WORKING_STATE_STORE);
  private readonly sync = inject(StateSyncService);
  private readonly entries = new Map<string, Entry>();
  private readonly keysByPlugin = new Map<string, Set<string>>();

  constructor() {
    this.sync.registerPrefix('working-state', STORAGE_PREFIX, (raw, key) => {
      const entry = this.entries.get(key);
      if (!entry) {
        return;
      }
      this.cancelPending(entry);
      entry.value.set(parseBlob(raw));
      entry.loaded.set(true);
    });
  }

  facade(pluginId: string): PluginState {
    return {
      watch: <T>(key: string) => this.watch<T>(pluginId, key),
    };
  }

  removePlugin(pluginId: string): void {
    const snapshot = [...this.entries];
    for (const [storageKey, entry] of snapshot) {
      if (entry.pluginId !== pluginId) {
        continue;
      }

      this.cancelPending(entry);
      entry.value.set(undefined);
      this.entries.delete(storageKey);
    }
    this.keysByPlugin.delete(pluginId);
    void readStoredValue(this.store, INDEX_PREFIX + pluginId).then((raw) => {
      for (const key of parseKeys(raw)) {
        void this.store.delete(this.storageKeyOf(pluginId, key));
      }
      void this.store.delete(INDEX_PREFIX + pluginId);
    });
  }

  private watch<T>(pluginId: string, key: string): StateHandle<T> {
    if (typeof key !== 'string' || key.length === 0) {
      throw new Error(
        `Plugin "${pluginId}": ctx.state.watch needs a non-empty key.`,
      );
    }
    const entry = this.entryFor(pluginId, key);
    entry.watchers += 1;
    let live = true;
    const release = () => {
      if (!live) {
        return;
      }
      live = false;
      entry.watchers -= 1;
      if (entry.watchers === 0) {
        this.flush(entry);
        this.entries.delete(entry.storageKey);
      }
    };
    return {
      value: () => entry.value() as T | undefined,
      loaded: () => entry.loaded(),
      set: (next: T) => this.write(entry, key, next),
      clear: () => this.remove(entry, key),
      dispose: release,
    };
  }

  private entryFor(pluginId: string, key: string): Entry {
    const storageKey = this.storageKeyOf(pluginId, key);
    const existing = this.entries.get(storageKey);
    if (existing) {
      return existing;
    }
    const value = signal<unknown>(parseBlob(this.store.peek?.(storageKey)));
    const loaded = signal(this.store.peek !== undefined);
    hydrateAsync(
      this.store,
      storageKey,
      (raw) => value.set(parseBlob(raw)),
      () => loaded.set(true),
    );
    const entry: Entry = {
      storageKey,
      pluginId,
      value,
      loaded,
      watchers: 0,
      pending: undefined,
      timer: undefined,
    };
    this.entries.set(storageKey, entry);
    return entry;
  }

  private write(entry: Entry, key: string, next: unknown): void {
    const serialised = JSON.stringify(next);
    if (!this.withinLimits(entry.pluginId, key, serialised)) {
      return;
    }
    entry.value.set(next);
    entry.pending = serialised;
    this.cancelTimer(entry);
    entry.timer = setTimeout(() => this.flush(entry), SAVE_DEBOUNCE_MS);
  }

  private remove(entry: Entry, key: string): void {
    this.cancelPending(entry);
    entry.value.set(undefined);
    void this.store.delete(entry.storageKey);
    const keys = this.keysByPlugin.get(entry.pluginId);
    keys?.delete(key);
    this.persistIndex(entry.pluginId);
  }

  private flush(entry: Entry): void {
    this.cancelTimer(entry);
    const pending = entry.pending;
    entry.pending = undefined;
    if (pending !== undefined) {
      void this.store.set(entry.storageKey, pending);
    }
  }

  private cancelPending(entry: Entry): void {
    this.cancelTimer(entry);
    entry.pending = undefined;
  }

  private cancelTimer(entry: Entry): void {
    if (entry.timer === undefined) {
      return;
    }

    clearTimeout(entry.timer);
    entry.timer = undefined;
  }

  private withinLimits(
    pluginId: string,
    key: string,
    serialised: string,
  ): boolean {
    const bytes = serialised.length;
    if (bytes > MAX_VALUE_BYTES) {
      console.error(
        `Plugin "${pluginId}": state key "${key}" is ${bytes} bytes, over the ${MAX_VALUE_BYTES}-byte ` +
          `limit for one value. The write was refused — keep large payloads out of the store and put a ` +
          `pointer to them in it instead.`,
      );
      return false;
    }
    const keys = this.knownKeys(pluginId);
    if (!keys.has(key) && keys.size >= MAX_KEYS) {
      console.error(
        `Plugin "${pluginId}": ${MAX_KEYS} state keys is the limit and "${key}" would be one more. ` +
          `The write was refused — clear the keys you no longer need.`,
      );
      return false;
    }
    if (isDevMode() && bytes > MAX_VALUE_BYTES / 2) {
      console.warn(
        `Plugin "${pluginId}": state key "${key}" is ${bytes} bytes, past half the per-value limit.`,
      );
    }
    if (isDevMode() && !keys.has(key) && keys.size + 1 > MAX_KEYS / 2) {
      console.warn(
        `Plugin "${pluginId}": ${keys.size + 1} state keys, past half the limit of ${MAX_KEYS}.`,
      );
    }
    if (!keys.has(key)) {
      keys.add(key);
      this.persistIndex(pluginId);
    }
    return true;
  }

  private knownKeys(pluginId: string): Set<string> {
    const existing = this.keysByPlugin.get(pluginId);
    if (existing) {
      return existing;
    }
    const keys = new Set(
      parseKeys(this.store.peek?.(INDEX_PREFIX + pluginId)),
    );
    this.keysByPlugin.set(pluginId, keys);
    void readStoredValue(this.store, INDEX_PREFIX + pluginId).then((raw) => {
      for (const key of parseKeys(raw)) {
        keys.add(key);
      }
    });
    return keys;
  }

  private persistIndex(pluginId: string): void {
    const keys = [...(this.keysByPlugin.get(pluginId) ?? [])];
    void this.store.set(INDEX_PREFIX + pluginId, JSON.stringify(keys));
  }

  private storageKeyOf(pluginId: string, key: string): string {
    return `${STORAGE_PREFIX}${pluginId}:${key}`;
  }
}
