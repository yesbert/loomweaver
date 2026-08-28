import { Provider } from '@angular/core';
import { KeyValueStore, LocalStorageStore } from './key-value-store';
import { SETTINGS_STORE } from './settings-store';
import { WORKING_STATE_STORE } from './working-state-store';
import { withCrossTabSync } from './cross-tab-sync-store';
import { BootLatchedIdentity, IdentityScopedStore } from './boot-latched-scope';

/**
 * The storage keys that stay **device-level** by default when the stores are identity-scoped
 *: preferences that reasonably belong to the browser, not the signed-in user. Extend the
 * default via `provideIdentityScopedStores({ deviceKeys: [...DEVICE_LEVEL_KEYS, 'my.key'] })`.
 */
export const DEVICE_LEVEL_KEYS: readonly string[] = [
  'lw.shell.theme',
  'lw.shell.lang',
  'lw.shell.font-scale',
];

/** Configuration for {@link provideIdentityScopedStores}. */
export interface IdentityScopedStoreOptions {
  /**
   * The identity discriminator, read synchronously. Return the current principal's stable id
   * (typically `AuthSnapshot.subject`; encode the tenant into it if tenant switches should
   * separate state). `null`/`undefined`/`''` means anonymous — keys pass through **unscoped**, so
   * a signed-out app behaves exactly like the unwrapped stores. Both stores **latch the first
   * non-empty value per boot** through one shared latch and never follow a live switch afterwards
   *: a change to a *different* subject only takes effect across the reload boundary
   * (`provideAuthSource(..., { onIdentityChange: 'reload' })`), so in-flight writes of the
   * departing user — a pending debounce, a commit during the login transition — can never land in
   * the next user's namespace. The shell peeks bootstrap-critical keys before first paint, so the
   * discriminator must be answerable synchronously at boot (persist the last-known subject
   * yourself).
   */
  identity: () => string | null | undefined;
  /**
   * Exact keys that stay unscoped regardless of identity. **Replaces** the default
   * ({@link DEVICE_LEVEL_KEYS}) — spread it to extend. Applied to both stores; the built-in
   * defaults are all settings keys, but a distribution may declare device-level keys of its own.
   */
  deviceKeys?: readonly string[];
  /** The wrapped settings store. Defaults to the built-in `localStorage` store. */
  settingsStore?: KeyValueStore;
  /** The wrapped working-state store. Defaults to the built-in `localStorage` store. */
  workingStateStore?: KeyValueStore;
}

/**
 * Scopes **both** persistence ports (`SETTINGS_STORE` and `WORKING_STATE_STORE`) per
 * signed-in user: every key outside `deviceKeys` is prefixed `lw.id.<identity>:` while
 * someone is signed in, so on a shared browser one user's pane trees, tab titles, workspaces,
 * view state and plugin settings are never re-hydrated for the next. Device-level keys and the
 * anonymous session write the original, unprefixed keys — a distribution without auth is
 * byte-identical to the unwrapped stores.
 *
 * Place after `provideShell()` (last provider wins). The standard answer to per-user state on a
 * shared browser; pair with `provideAuthSource(..., { onIdentityChange: 'reload' })` so a user
 * switch re-hydrates cleanly from the new namespace. The cross-tab sync wrapper is applied on top
 * of both stores; `peek` is offered only when the wrapped store offers it, because the
 * shell branches on the *presence* of `peek` (sync bootstrap vs. async hydration).
 */
export function provideIdentityScopedStores(
  options: IdentityScopedStoreOptions,
): Provider {
  const latch = new BootLatchedIdentity(options.identity);
  const deviceKeys = new Set(options.deviceKeys ?? DEVICE_LEVEL_KEYS);
  const scoped = (inner: KeyValueStore | undefined): KeyValueStore =>
    new IdentityScopedStore(
      inner ?? new LocalStorageStore(),
      latch,
      deviceKeys,
    );
  return [
    {
      provide: SETTINGS_STORE,
      useFactory: () => withCrossTabSync(scoped(options.settingsStore)),
    },
    {
      provide: WORKING_STATE_STORE,
      useFactory: () => withCrossTabSync(scoped(options.workingStateStore)),
    },
  ];
}
