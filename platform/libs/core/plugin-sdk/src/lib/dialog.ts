import { LwButtonVariant } from './button.js';

/**
 * Severity of a dialog. Drives the leading icon + its tint and the confirm
 * button colour in one field, so they always match the theme.
 */
export type DialogTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

/** Panel width for a dialog opened with a custom body. Defaults to `md`. */
export type DialogSize = 'md' | 'lg' | 'xl';

/**
 * Validated single-input guard for a confirm (e.g. type-to-confirm a destructive action).
 * `validate` is the uniform validation contract: return `null` to **allow**
 * confirming, or a string to **block** it. A non-empty string is shown inline as the reason;
 * an **empty string blocks silently** (e.g. a type-to-confirm whose instruction is in `label`).
 */
export interface RequireConfirmation {
  /** Label above the input (Markdown), e.g. `Type **Reset** to confirm`. */
  readonly label: string;
  /** `null` = allow; a string = block (non-empty shown inline, empty blocks silently). */
  readonly validate: (value: string) => string | null;
  readonly placeholder?: string;
}

/** Options for a yes/no confirm. `message` is Markdown. */
export interface ConfirmOptions {
  readonly title?: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  /** Severity → icon + confirm button colour. Defaults to `default` (primary). */
  readonly tone?: DialogTone;
  /** Override the tone's default leading icon (host icon name). */
  readonly icon?: string;
  /** Require the user to type an exact phrase before confirming (destructive guard). */
  readonly requireConfirmation?: RequireConfirmation;
}

/** Options for an alert (single acknowledge button). `message` is Markdown. */
export interface AlertOptions {
  readonly title?: string;
  readonly message: string;
  readonly okLabel?: string;
  readonly tone?: DialogTone;
  readonly icon?: string;
}

/** Options for a text prompt. `message` is Markdown. */
export interface PromptOptions {
  readonly title?: string;
  readonly message: string;
  readonly initial?: string;
  readonly placeholder?: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly tone?: DialogTone;
  readonly icon?: string;
}

/** A footer button declared for a custom-body dialog. */
export interface DialogButton {
  /** Transloco key or literal. */
  readonly label: string;
  readonly variant?: LwButtonVariant;
  /** Value the dialog resolves to when this button is clicked. */
  readonly value?: unknown;
}

/** Options for a progress indicator. */
export interface ProgressOptions {
  readonly title?: string;
  /** Status text shown next to the spinner (updatable via the handle). */
  readonly message: string;
}

/** Controls a live progress dialog. */
export interface ProgressHandle {
  /** Replace the status text. */
  update(message: string): void;
  /** Close the progress dialog. */
  close(): void;
}

/** Options for opening a custom body component as a dialog. */
export interface OpenOptions {
  readonly title?: string;
  readonly data?: unknown;
  readonly buttons?: readonly DialogButton[];
  /** Backdrop click / Escape / close-X dismiss the dialog. Defaults to `true`. */
  readonly dismissable?: boolean;
  readonly tone?: DialogTone;
  /** Host icon name. */
  readonly icon?: string;
  /** Panel width. Defaults to `md`. */
  readonly size?: DialogSize;
  /**
   * The host frame shows a maximize/restore control (near-fullscreen). A bare dialog draws its own
   * control instead and may call `DialogRef.toggleMaximized` regardless of this flag.
   */
  readonly maximizable?: boolean;
  /**
   * Render only the component filling the panel — no host icon/title/close/footer/padding.
   * The component owns its full chrome (e.g. the two-column settings surface). Defaults to `false`.
   */
  readonly bare?: boolean;
  /**
   * Vertical anchor of the panel. `'top'` pins the panel's top edge near the top of the viewport on
   * every width — phones included — so a panel whose height follows its content (a filtering list
   * like the command palette) grows and shrinks downward instead of jumping around the centre, and
   * an on-screen keyboard never covers it. `'center'` (the default) keeps the centred desktop panel
   * and the mobile bottom sheet.
   */
  readonly align?: 'center' | 'top';
}
