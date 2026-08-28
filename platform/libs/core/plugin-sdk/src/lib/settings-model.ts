import { Type } from '@angular/core';
import { LwButtonVariant } from './button.js';

/**
 * Settings vocabulary (schema-driven). The host renders a settings
 * surface from these declarations; each contributor (shell or plugin) supplies its own
 * value accessors, so the *owner* keeps responsibility for storage. The host only reads
 * `value()` and calls `set()`. The control vocabulary grows demand-driven (YAGNI):
 * `select` (single choice) · `toggle` (on/off) · `text` (a string field) · `slider` (a number) ·
 * `button` (an action) · `component` (embed a component).
 */

/** An option in a {@link SettingSelect}. `label` is a Transloco key. */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

/**
 * A single-choice dropdown control. It owns its value binding — the contributor supplies
 * `value()`/`set()`, so the *owner* keeps responsibility for storage (the host only reads
 * and writes through them). Changes save immediately (the host calls `set()` on change).
 */
export interface SettingSelect {
  readonly kind: 'select';
  readonly options: readonly SelectOption[];
  /** Reads the current value — a signal works directly (it is a `() => string`). */
  readonly value: () => string;
  /** Persists a new value; the owner decides how and where. */
  readonly set: (value: string) => void;
}

/**
 * An on/off toggle (switch) control. Like {@link SettingSelect} it owns its value binding — the contributor
 * supplies `value()`/`set()` (boolean), so the *owner* keeps storage. Changes save immediately.
 */
export interface SettingToggle {
  readonly kind: 'toggle';
  readonly value: () => boolean;
  readonly set: (value: boolean) => void;
}

/**
 * A single-line text field control. Owns its value binding (`value()`/`set()` — a string). `inputType`
 * picks the native input type (default `text`; e.g. `date`/`email`/`number`); `placeholder` is a Transloco
 * key. Changes save immediately.
 */
export interface SettingText {
  readonly kind: 'text';
  readonly value: () => string;
  readonly set: (value: string) => void;
  readonly inputType?: 'text' | 'date' | 'email' | 'number' | 'password';
  readonly placeholder?: string;
}

/**
 * A numeric slider control. Owns its value binding (`value()`/`set()` — a number). `min`/`max`/`step` bound
 * and quantise it (defaults 0/100/1). Changes save immediately.
 */
export interface SettingSlider {
  readonly kind: 'slider';
  readonly value: () => number;
  readonly set: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

/**
 * An action button control — no stored value. Provide a registered {@link Command} id via
 * `command` (so the palette/keybindings can share the behaviour), **or** an inline `run()` for a
 * one-off action (e.g. opening a dialog). `label` is a Transloco key.
 */
export interface SettingButton {
  readonly kind: 'button';
  readonly label: string;
  readonly variant?: LwButtonVariant;
  /** Id of a registered command to run on click. Provide this **or** {@link run}. */
  readonly command?: string;
  /** Inline behaviour for a button not backed by a registered command. Provide this **or** {@link command}. */
  readonly run?: () => void;
}

/**
 * Embeds an existing component as the control — lets a
 * setting reuse a host or plugin widget directly instead of re-describing it. The component
 * reads/writes its own state via its own services.
 */
export interface SettingComponent {
  readonly kind: 'component';
  readonly component: Type<unknown>;
  /**
   * Renders the component as a full-width block instead of in the row's right-hand control slot — for
   * a self-contained widget that owns the whole row (e.g. a table or a list), not a compact control
   * sitting beside a label. The row's `label`/`description` are then not painted; the component
   * provides its own heading.
   */
  readonly fullWidth?: boolean;
}

/** A settings control — the host renders each kind with the matching primitive. */
export type SettingControl =
  | SettingSelect
  | SettingToggle
  | SettingText
  | SettingSlider
  | SettingButton
  | SettingComponent;

/**
 * One row in a settings section: a label/description the host paints and a control it
 * renders. Value binding (for value controls) lives on the control itself.
 */
export interface SettingRow {
  readonly id: string;
  /** Transloco key for the row label. */
  readonly label: string;
  /** Optional Transloco key for a secondary description line. */
  readonly description?: string;
  readonly control: SettingControl;
}

/** A contributed group of rows. The host renders sections ordered by `order` (default 0). */
export interface SettingsSection {
  readonly id: string;
  /** Transloco key for the section heading (and its left-nav entry). */
  readonly title: string;
  /** Transloco key for the left-nav group header this section sits under (e.g. Options vs Plugins). */
  readonly group?: string;
  readonly order?: number;
  readonly rows: readonly SettingRow[];
}

/**
 * The **data-only** control form a *sandboxed* plugin declares over the RPC boundary (the VS Code
 * `contributes.configuration` model): the declaration carries the control kind and its
 * **default value** instead of `value()`/`set()` callbacks, which cannot cross the wire. The host
 * renders the control, **owns the storage** (user-local through the distribution's `SETTINGS_STORE` port)
 * and pushes the current values back to the plugin — once after registration and on every change —
 * by calling the `settingsChanged(sectionId, values)` method the plugin exposes on its RPC channel.
 */
export type FrameSettingControl =
  | { readonly kind: 'toggle'; readonly value: boolean }
  | {
      readonly kind: 'text';
      readonly value: string;
      readonly inputType?: 'text' | 'date' | 'email' | 'number' | 'password';
      readonly placeholder?: string;
    }
  | { readonly kind: 'select'; readonly value: string; readonly options: readonly SelectOption[] }
  | {
      readonly kind: 'slider';
      readonly value: number;
      readonly min?: number;
      readonly max?: number;
      readonly step?: number;
    };

/**
 * One declared row of a sandboxed plugin's settings. `label`/`description` may be plain literals — a
 * sandboxed plugin cannot contribute translations, and the host renders an unknown key as-is.
 */
export interface FrameSettingRow {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly control: FrameSettingControl;
}

/**
 * A sandboxed plugin's settings section. Registered over RPC via
 * `ctx.registerSettingsSection`; the host decides the nav **group** (never the plugin): an
 * *installed* plugin's section appears under **Community plugins**, a composed frame plugin's
 * under **App plugins** — a plugin cannot masquerade as part of the app.
 */
export interface FrameSettingsSection {
  readonly id: string;
  readonly title: string;
  readonly order?: number;
  readonly rows: readonly FrameSettingRow[];
}
