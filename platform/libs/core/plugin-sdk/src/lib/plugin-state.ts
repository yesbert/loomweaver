/**
 * A handle on one key of your plugin's own store. Reads are Signal-shaped, exactly like
 * {@link ViewState} and `ctx.session`, so a template re-reads reactively without subscription
 * bookkeeping.
 */
export interface StateHandle<T = unknown> {
  /** The stored value, reactive; `undefined` when nothing is stored (apply your own default). */
  readonly value: () => T | undefined;
  /**
   * Whether the store has answered yet. Check it before you apply a default, otherwise a
   * network-backed store lands its value **after** the user has started typing and overwrites the
   * input. With a local store this is true immediately; the gate costs nothing there and is the
   * difference between working and losing input everywhere else.
   */
  readonly loaded: () => boolean;
  /**
   * Replace the value under this key. It replaces the **whole** value — nothing is merged — so spread
   * the current one when you change a field. Writes are debounced; call it per keystroke if you like.
   * Values are JSON: the store is string-valued and crosses a process boundary, so promising
   * structured clone would be a lie.
   */
  set(next: T): void;
  /** Remove the key from the store. */
  clear(): void;
  /** Stop watching. Any pending write is flushed first. */
  dispose(): void;
}

/**
 * Your plugin's **own** keyed store — `ctx.state`. Every surface of your plugin sees the
 * same store, whichever dock it sits in, however many instances are open and in every browser window,
 * which makes it both your persistence and the only channel between your own surfaces. It is
 * plugin-private by construction: the host prefixes every key with your plugin id and you cannot
 * leave that namespace, so there is nothing foreign to reach and no capability to grant.
 *
 * It holds **working state**, not settings. Settings have their own path precisely because the user
 * can *see* them in the settings dialog; a free-form settings store would be a back door around that
 * transparency. Uninstalling your plugin deletes this store (a settings section survives, an
 * abandoned draft is litter).
 *
 * The authoring rule that follows from "set replaces the whole value": **one key per unit of
 * editing** — a wizard step, not the whole form — and where a surface can exist more than once, key
 * by instance as well. Two windows editing two keys converge; two windows replacing one key means
 * last write wins, which is fine for convergence and not fine for the user's typing.
 */
export interface PluginState {
  /**
   * Watch one key and get a handle on it. This is also how the host learns which keys you care
   * about: with free-form keys it cannot push everything, so the call that hands out the handle is
   * the interest registration. Call {@link StateHandle.dispose} when your surface goes away.
   */
  watch<T = unknown>(key: string): StateHandle<T>;
}
