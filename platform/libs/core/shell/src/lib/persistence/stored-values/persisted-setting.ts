import { inject, Signal, signal } from '@angular/core';
import { hydrateAsync, readStoredValue } from './hydrate';
import { KeyValueStore } from '../key-value-store';
import { SETTINGS_STORE } from '../settings-store';
import { WORKING_STATE_STORE } from '../working-state-store';
import { StateSyncService } from '../cross-tab/state-sync.service';

export interface PersistedSetting<T> {
  readonly value: Signal<T>;
  readonly answered: Signal<boolean>;
  set(next: T): void;
  update(change: (current: T) => T): void;
  clear(): void;
}

export interface SettingCodec<T> {
  readonly parse: (raw: string | undefined) => T;
  readonly serialize: (value: T) => string;
}

type Change<T> = { readonly clear: true } | { readonly clear: false; readonly change: (current: T) => T };

interface StoredValue<T> {
  readonly setting: PersistedSetting<T>;
  readonly apply: (raw: string | undefined) => void;
}

export function persistedSetting<T>(
  key: string,
  codec: SettingCodec<T>,
): PersistedSetting<T> {
  const stored = storedValue(inject(SETTINGS_STORE), key, codec);
  inject(StateSyncService).register('settings', key, stored.apply);
  return stored.setting;
}

export function persistedWorkingState<T>(
  key: string,
  codec: SettingCodec<T>,
): PersistedSetting<T> {
  const store = inject(WORKING_STATE_STORE);
  const stored = storedValue(store, key, codec);
  inject(StateSyncService).onNamespaceAdopted(async () =>
    stored.apply(await readStoredValue(store, key)),
  );
  return stored.setting;
}

function storedValue<T>(
  store: KeyValueStore,
  key: string,
  codec: SettingCodec<T>,
): StoredValue<T> {
  const state = signal(codec.parse(store.peek?.(key)));
  let hydrated = store.peek !== undefined;
  const answered = signal(hydrated);
  let early: Change<T>[] = [];

  const write = (next: Change<T>): void => {
    if (next.clear) {
      state.set(codec.parse(undefined));
      void store.delete(key);
      return;
    }
    const value = next.change(state());
    state.set(value);
    void store.set(key, codec.serialize(value));
  };

  const replay = (raw: string | undefined): void => {
    const changes = early;
    early = [];
    hydrated = true;
    answered.set(true);
    state.set(codec.parse(raw));
    for (const change of changes) {
      write(change);
    }
  };

  const apply = (raw: string | undefined): void => {
    if (!hydrated) {
      replay(raw);
      return;
    }
    state.set(codec.parse(raw));
  };

  const change = (next: Change<T>): void => {
    if (hydrated) {
      write(next);
      return;
    }
    early.push(next);
    state.set(next.clear ? codec.parse(undefined) : next.change(state()));
  };

  hydrateAsync(store, key, apply, (loaded) => {
    if (!loaded && !hydrated) {
      replay(undefined);
    }
  });
  return {
    apply,
    setting: {
      value: state.asReadonly(),
      answered: answered.asReadonly(),
      set: (next) => change({ clear: false, change: () => next }),
      update: (next) => change({ clear: false, change: next }),
      clear: () => change({ clear: true }),
    },
  };
}
