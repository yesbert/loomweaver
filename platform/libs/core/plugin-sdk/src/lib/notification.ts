/** Severity of a notification — drives icon and accent. */
export type NotificationKind = 'info' | 'success' | 'warning' | 'error';

/**
 * A single action button on a toast (e.g. "Reload" on an update notice).
 * Trusted in-process runtime only — a sandboxed plugin's `action` does not cross the RPC
 * boundary and is dropped (like `OpenTabInput.onClose`).
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
  /** Severity; defaults to `info`. */
  readonly kind?: NotificationKind;
  /**
   * Optional single action button. (Trusted in-process runtime only — over the sandbox RPC
   * boundary the action is dropped and the toast shows without a button.)
   */
  readonly action?: NotificationAction;
  /** Auto-dismiss after this many ms. Omit or `0` = sticky until dismissed. */
  readonly timeoutMs?: number;
  /** Stable id — reusing an id replaces the existing toast instead of stacking. */
  readonly id?: string;
}
