import { inject, Service } from '@angular/core';
import { SETTINGS_STORE } from './settings-store';
import { WORKING_STATE_STORE } from './working-state-store';
import { StateSyncChannel } from './state-sync-channel';
import { readStoredValue } from './hydrate';

/**
 * Where a synced key's fresh value is read back from after another window announced a change
 *: the `SETTINGS_STORE`, the `WORKING_STATE_STORE`, or — for state persisted outside
 * both ports, such as a product session store — `'external'`, in which case no read-back happens
 * and the applier receives `undefined` (it re-reads its own storage).
 */
export type SyncSource = 'settings' | 'working-state' | 'external';

/**
 * Re-applies a key that another browser window just wrote. `raw` is the value read back from the
 * registered {@link SyncSource}'s store (`undefined` for `'external'` registrations) — the store
 * stays the single source of truth, the message only names the key. An applier must **set its
 * state without persisting again**, or two windows would write back and forth forever.
 */
export type ApplySyncedState = (raw: string | undefined, key: string) => void;

interface Registration {
  readonly source: SyncSource;
  readonly apply: ApplySyncedState;
}

/**
 * Cross-tab live sync at the persistence seams. Every write through either port
 * broadcasts its **key** to the other windows of the same origin over a `BroadcastChannel`; a
 * window that has registered a reaction for that key reads the fresh value back through the
 * registered source's store and applies it — so it works with any store behind the ports,
 * including a product's HTTP-backed one.
 *
 * The shell registers its own keys (settings such as theme, language and text size on the
 * `'settings'` source; view state, view instances and the palette's recently-used list on
 * `'working-state'`), so plugins inherit the sync for free: their state lives in host-managed
 * stores. **Layout keys are deliberately not registered** — two windows are meant to be able to
 * show different layouts.
 *
 * A distribution registers its own keys the same way, most usefully its product session key
 * (source `'external'`): when it changes, the other window's `AuthSnapshot` flips and the existing
 * `onIdentityChange` policy takes over. Use {@link announce} when that state is
 * persisted outside the ports, and {@link notifyRemoteChange} when a backend push transport
 * reports a change made on another device.
 */
@Service()
export class StateSyncService {
  private readonly settings = inject(SETTINGS_STORE);
  private readonly workingState = inject(WORKING_STATE_STORE);
  private readonly channel = inject(StateSyncChannel);
  private readonly exact = new Map<string, Registration>();
  private readonly prefixes = new Map<string, Registration>();

  constructor() {
    this.channel.listen((key) => this.applyRemote(key));
  }

  /**
   * Reacts to remote writes of exactly `key`; `source` names the store the fresh value is read
   * back from. One applier per key — registering again replaces it. Returns a disposer that
   * unregisters this applier (a later re-registration always wins over a stale disposer).
   */
  register(
    source: SyncSource,
    key: string,
    apply: ApplySyncedState,
  ): () => void {
    const registration: Registration = { source, apply };
    this.exact.set(key, registration);
    return () => {
      if (this.exact.get(key) === registration) {
        this.exact.delete(key);
      }
    };
  }

  /**
   * Reacts to remote writes of every key starting with `prefix` — for key families such as
   * `lw.shell.view-state:`. Exact registrations win over prefixes. Returns a disposer that
   * unregisters this applier (a later re-registration always wins over a stale disposer).
   */
  registerPrefix(
    source: SyncSource,
    prefix: string,
    apply: ApplySyncedState,
  ): () => void {
    const registration: Registration = { source, apply };
    this.prefixes.set(prefix, registration);
    return () => {
      if (this.prefixes.get(prefix) === registration) {
        this.prefixes.delete(prefix);
      }
    };
  }

  /**
   * Announces a change this window made to state that is persisted **outside** the persistence
   * ports — a product session store, for example. Writes through the ports broadcast on their own;
   * this is the escape hatch for state the ports never see. Notifies only the **other** windows.
   */
  announce(key: string): void {
    this.channel.post(key);
  }

  /**
   * Runs the registered applier for `key` in **this** window, reading the fresh value back from
   * the registered source's store. The entry point for cross-device live sync: a
   * backend-backed store paired with a push transport (SSE, WebSocket) calls this when the backend
   * reports a key changed on another device. No-op for keys without a registration.
   */
  notifyRemoteChange(key: string): void {
    this.applyRemote(key);
  }

  private applyRemote(key: string): void {
    const registration = this.registrationFor(key);
    if (!registration) {
      return;
    }
    void this.readBack(registration.source, key)
      .then((raw) =>
        this.channel.whileApplying(() => registration.apply(raw, key)),
      )
      .catch(() => undefined);
  }

  private readBack(
    source: SyncSource,
    key: string,
  ): Promise<string | undefined> {
    if (source === 'external') {
      return Promise.resolve(undefined);
    }
    const store = source === 'settings' ? this.settings : this.workingState;
    return readStoredValue(store, key);
  }

  private registrationFor(key: string): Registration | undefined {
    const exact = this.exact.get(key);
    if (exact) {
      return exact;
    }
    for (const [prefix, registration] of this.prefixes) {
      if (key.startsWith(prefix)) {
        return registration;
      }
    }
    return undefined;
  }
}
