import { inject, Signal, signal } from '@angular/core';
import { hydrateAsync } from './hydrate';
import { SETTINGS_STORE } from '../settings-store';
import { StateSyncService } from '../state-sync.service';

export interface PersistedSetting<T> {
  readonly value: Signal<T>;
  set(next: T): void;
}

export interface SettingCodec<T> {
  readonly parse: (raw: string | undefined) => T;
  readonly serialize: (value: T) => string;
}

export function persistedSetting<T>(
  key: string,
  codec: SettingCodec<T>,
): PersistedSetting<T> {
  const store = inject(SETTINGS_STORE);
  const state = signal(codec.parse(store.peek?.(key)));
  const apply = (raw: string | undefined) => state.set(codec.parse(raw));
  hydrateAsync(store, key, apply);
  inject(StateSyncService).register('settings', key, apply);
  return {
    value: state.asReadonly(),
    set: (next) => {
      state.set(next);
      void store.set(key, codec.serialize(next));
    },
  };
}
