import {
  EnvironmentProviders,
  effect,
  inject,
  Provider,
  provideEnvironmentInitializer,
  untracked,
} from '@angular/core';
import { KeyValueStore, LocalStorageStore } from '../key-value-store';
import { SETTINGS_STORE } from '../settings-store';
import { WORKING_STATE_STORE } from '../working-state-store';
import { withCrossTabSync } from '../cross-tab/cross-tab-sync-store';
import { AuthContext } from '../../auth/auth-context';
import { StateSyncService } from '../cross-tab/state-sync.service';
import { NotificationService } from '../../notifications/notification.service';
import { BootLatchedIdentity } from './boot-latched-identity';
import { IdentityScopedStore } from './identity-scoped-store';
import {
  FONT_SCALE_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '../device-level-keys';

const ADOPTION_BOUND_MS = 10_000;

/**
 * The storage keys that stay **device-level** by default when the stores are identity-scoped:
 * preferences that reasonably belong to the browser, not the signed-in user. Extend the
 * default via `provideIdentityScopedStores({ deviceKeys: [...DEVICE_LEVEL_KEYS, 'my.key'] })`.
 */
export const DEVICE_LEVEL_KEYS: readonly string[] = [
  THEME_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  FONT_SCALE_STORAGE_KEY,
];

/** Configuration for {@link provideIdentityScopedStores}. */
export interface IdentityScopedStoreOptions {
  /**
   * The identity discriminator, read synchronously. Return the current principal's stable id
   * (typically `AuthSnapshot.subject`; encode the tenant into it if tenant switches should
   * separate state). `null`/`undefined`/`''` means anonymous — keys pass through **unscoped**, so
   * a signed-out app behaves exactly like the unwrapped stores. Both stores **latch the first
   * non-empty value per boot** through one shared latch and never follow a live switch afterwards:
   * a change to a *different* subject only takes effect across the reload boundary
   * (`provideAuthSource(..., { onIdentityChange: 'reload' })`), so in-flight writes of the
   * departing user — a pending debounce, a commit during the login transition — can never land in
   * the next user's namespace. The shell peeks bootstrap-critical keys before first paint, so the
   * discriminator must be answerable synchronously at boot (persist the last-known subject
   * yourself). Where it cannot be, nothing stored for that user is lost: from the moment an
   * anonymous session adopts a namespace, writes are held and everything already read is read again
   * from the adopted namespace. Every key read during the adoption that the adopted namespace holds
   * nothing for is answered with the value read or written for it while nobody was known, and that
   * value is copied there; a write held meanwhile is stored only where the adopted namespace holds
   * nothing for its key. What remains is the flash before the session lands.
   *
   * An adoption that has not settled after ten seconds, because the port or a handler registered
   * with `StateSyncService.onNamespaceAdopted` never answers, is given up. The writes held during it
   * are then stored in the person's namespace, nothing is copied from or deleted in the anonymous
   * one, and the user is told that the local work stays on this device. The next session that
   * begins anonymously adopts again.
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
): (Provider | EnvironmentProviders)[] {
  const latch = new BootLatchedIdentity(options.identity);
  const deviceKeys = new Set(options.deviceKeys ?? DEVICE_LEVEL_KEYS);
  const scoped = (inner: KeyValueStore | undefined): IdentityScopedStore =>
    new IdentityScopedStore(
      inner ?? new LocalStorageStore(),
      latch,
      deviceKeys,
    );
  const settings = scoped(options.settingsStore);
  const workingState = scoped(options.workingStateStore);
  return [
    {
      provide: SETTINGS_STORE,
      useFactory: () => withCrossTabSync(settings),
    },
    {
      provide: WORKING_STATE_STORE,
      useFactory: () => withCrossTabSync(workingState),
    },
    provideEnvironmentInitializer(() => {
      const sync = inject(StateSyncService);
      const auth = inject(AuthContext);
      const notifications = inject(NotificationService);
      latch.watchAdoption(() => {
        void adoptNamespace(sync, latch, [settings, workingState]).then(
          (outcome) => {
            if (outcome === 'given up') {
              notifications.show({
                message: 'auth.localWorkKept',
                kind: 'warning',
              });
            }
          },
        );
      });
      effect(() => {
        auth.state();
        untracked(() => latch.latch());
      });
    }),
  ];
}

type Adoption = 'adopted' | 'given up';

async function adoptNamespace(
  sync: StateSyncService,
  latch: BootLatchedIdentity,
  stores: readonly IdentityScopedStore[],
): Promise<Adoption> {
  const ignored = (): undefined => undefined;
  const adopted = sync
    .namespaceAdopted()
    .catch(ignored)
    .then(() =>
      Promise.all(stores.map((store) => store.writeWhereTheNamespaceIsEmpty())),
    )
    .then(ignored, ignored)
    .then((): Adoption => 'adopted');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const bound = new Promise<Adoption>((resolve) => {
    timer = setTimeout(() => resolve('given up'), ADOPTION_BOUND_MS);
  });
  const outcome = await Promise.race([adopted, bound]);
  clearTimeout(timer);
  latch.settle();
  if (outcome === 'adopted') {
    void Promise.all(
      stores.map((store) => store.writeWhatArrivedDuringAdoption()),
    ).catch(ignored);
  } else {
    await Promise.all(
      stores.map((store) => store.writeWhatWasHeldWithoutAdopting()),
    ).catch(ignored);
  }
  return outcome;
}
