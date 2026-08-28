import { InjectionToken, Provider, Type } from '@angular/core';
import { KeyValueStore, LocalStorageStore } from './key-value-store';
import { withCrossTabSync } from './cross-tab-sync-store';
import { providePortStore } from './port-store-provider';

/**
 * The **working-state** persistence port: state that accrues from using the app rather
 * than from deciding something — view state and view instances, the palette's recently-used list,
 * and the window-local layout keys (pane trees, panel sizes, collapse state, item order, view
 * placement). Writes are frequent and debounced, which is why this port defaults to the device
 * ({@link LocalStorageStore}) instead of a product backend.
 *
 * A distribution that wants working state to travel across devices provides a backend-backed store
 * with {@link provideWorkingStateStore}: a fresh tab then hydrates the last persisted state at boot
 * with no further wiring. For *live* cross-device updates, pair the store with a push transport
 * (SSE, WebSocket) that calls `StateSyncService.notifyRemoteChange` when the backend reports a
 * changed key.
 */
export const WORKING_STATE_STORE = new InjectionToken<KeyValueStore>(
  'lw.working-state-store',
  {
    providedIn: 'root',
    factory: () => withCrossTabSync(new LocalStorageStore()),
  },
);

/**
 * Provides a custom working-state {@link KeyValueStore}, replacing the default `localStorage` one —
 * place after `provideShell()` (last provider wins). Pass a class (DI-constructed) or a ready
 * instance. The cross-tab sync wrapper is applied on top either way.
 */
export function provideWorkingStateStore(
  store: KeyValueStore | Type<KeyValueStore>,
): Provider {
  return providePortStore(WORKING_STATE_STORE, store);
}
