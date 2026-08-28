import { InjectionToken, Provider, Type } from '@angular/core';
import { KeyValueStore, LocalStorageStore } from './key-value-store';
import { withCrossTabSync } from './cross-tab-sync-store';
import { providePortStore } from './port-store-provider';

/**
 * The **settings** persistence port: deliberate user decisions only — theme,
 * language, text size, plugin settings, installed/disabled plugins, capability revocations and the
 * saved-workspaces list. Working state (view state, layout, usage traces) never flows through this
 * port; it lives behind `WORKING_STATE_STORE`. That guarantee is structural, which is what makes
 * this port the right seam for a product backend: writes are rare, small and roaming-worthy, so a
 * REST-backed implementation (the `ISettingsRepository` pattern) receives exactly
 * what it expects. Swap the backing store with {@link provideSettingsStore}; the built-in default
 * is {@link LocalStorageStore}.
 */
export const SETTINGS_STORE = new InjectionToken<KeyValueStore>(
  'lw.settings-store',
  {
    providedIn: 'root',
    factory: () => withCrossTabSync(new LocalStorageStore()),
  },
);

/**
 * Provides a custom settings {@link KeyValueStore}, replacing the default `localStorage` one —
 * place after `provideShell()` (last provider wins). Pass a class (DI-constructed) or a ready
 * instance. The cross-tab sync wrapper is applied on top either way.
 */
export function provideSettingsStore(
  store: KeyValueStore | Type<KeyValueStore>,
): Provider {
  return providePortStore(SETTINGS_STORE, store);
}
