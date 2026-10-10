/** Severity of a notification — drives icon and accent. */
export type NotificationKind = 'info' | 'success' | 'warning' | 'error';

/**
 * A single action button on a toast (e.g. "Reload" on an update notice). Only for a trusted plugin:
 * a sandboxed plugin's `action` does not cross the RPC boundary and is dropped.
 */
export interface NotificationAction {
  /** Transloco key or literal for the button label. */
  readonly label: string;
  run(): void;
}

/** What a caller passes to the host notification service. */
export interface NotificationInput {
  /** Transloco key or literal for the message. */
  readonly message: string;
  /** Severity; defaults to `info`. It decides the colour, the icon and how urgently the toast is announced. */
  readonly kind?: NotificationKind;
  /**
   * Optional icon (registry name) shown instead of the kind's, like every other `icon` field.
   * Decoration only: the colour and the urgency stay the kind's, and the message is what the toast says.
   */
  readonly icon?: string;
  /**
   * Optional single action button. Only for a trusted plugin: from a sandboxed plugin the toast shows
   * without it.
   */
  readonly action?: NotificationAction;
  /**
   * How long the toast is shown, in ms, counted from the moment it is shown. Omit it and the kind
   * decides: `info`, `success` and `warning` leave by themselves, `error` stays until dismissed.
   * `0` keeps a toast of any kind until dismissed. A toast that offers an `action` should state its
   * lifetime rather than rely on the kind.
   *
   * From a sandboxed plugin a toast always leaves: `0`, a long lifetime and an `error` without one are
   * all shortened to the longest lifetime a sandboxed plugin may have.
   */
  readonly timeoutMs?: number;
  /**
   * Stable id — reusing an id replaces the existing toast instead of stacking. Without an id, raising
   * the same toast again while the first is still there is counted on the first instead.
   */
  readonly id?: string;
}
