import { inject, Signal, signal } from '@angular/core';
import { hydrateAsync } from './hydrate';
import { SETTINGS_STORE } from '../settings-store';
import { StateSyncService } from '../cross-tab/state-sync.service';

export interface PersistedSetting<T> {
  readonly value: Signal<T>;
  set(next: T): void;
  update(change: (current: T) => T): void;
  clear(): void;
}

export interface SettingCodec<T> {
  readonly parse: (raw: string | undefined) => T;
  readonly serialize: (value: T) => string;
}

type Change<T> = { readonly clear: true } | { readonly clear: false; readonly change: (current: T) => T };

export function persistedSetting<T>(
  key: string,
  codec: SettingCodec<T>,
): PersistedSetting<T> {
  const store = inject(SETTINGS_STORE);
  const state = signal(codec.parse(store.peek?.(key)));
  let hydrated = store.peek !== undefined;
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
  inject(StateSyncService).register('settings', key, apply);
  return {
    value: state.asReadonly(),
    set: (next) => change({ clear: false, change: () => next }),
    update: (next) => change({ clear: false, change: next }),
    clear: () => change({ clear: true }),
  };
}
