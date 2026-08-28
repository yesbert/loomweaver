/**
 * The shared shape of the shell's two persistence ports: `SETTINGS_STORE` for genuine
 * settings and `WORKING_STATE_STORE` for working state. A store implemented once fits either port —
 * only what the shell routes through it differs.
 *
 * It is a plain **string** key-value store: callers serialise/validate their own payloads (they already
 * do so defensively), which keeps the wire format identical to what the shell wrote before — no data
 * migration. `get`/`set`/`delete` are async so a network-backed store fits; the optional {@link peek} is
 * a synchronous fast-path for bootstrap-critical reads (theme, panel sizes) that must apply before the
 * first paint. A store that cannot answer synchronously (network-backed) omits `peek`; callers then start
 * from a default and reconcile via `get`.
 */
export interface KeyValueStore {
  /**
   * Reads the stored string for `key`, or `undefined` if absent. Untrusted — callers validate its shape.
   * Best-effort like {@link set}: prefer resolving with `undefined` over rejecting when the read fails
   * (a network store that is offline or unauthorized). The shell treats a rejection as "no value" rather
   * than failing startup, but a store that rejects makes the user's data silently unavailable.
   */
  get(key: string): Promise<string | undefined>;
  /** Writes `value` for `key`. Best-effort: implementations resolve even when persistence fails. */
  set(key: string, value: string): Promise<void>;
  /** Removes the value for `key`. */
  delete(key: string): Promise<void>;
  /**
   * Optional synchronous snapshot of `key` for bootstrap-critical reads that must apply before first
   * paint. Omitted by stores that can only answer asynchronously — callers fall back to {@link get}.
   */
  peek?(key: string): string | undefined;
}

/**
 * Default {@link KeyValueStore}: user-local `localStorage`. Reads and writes are synchronous
 * under the hood — `peek` exposes that for zero-flash bootstrap — and wrapped in the same best-effort
 * try/catch the shell used before (private browsing, quota, corrupt payloads). Both persistence ports
 * default to an instance of this store.
 */
export class LocalStorageStore implements KeyValueStore {
  peek(key: string): string | undefined {
    try {
      return localStorage.getItem(key) ?? undefined;
    } catch {
      return undefined;
    }
  }

  get(key: string): Promise<string | undefined> {
    return Promise.resolve(this.peek(key));
  }

  set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {
      return Promise.resolve();
    }
    return Promise.resolve();
  }
}
