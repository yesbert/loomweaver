import { SelectOption } from './settings-section.js';

/**
 * The **data-only** control form a *sandboxed* plugin declares over the RPC boundary: the
 * declaration carries the control kind and its
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
 * *installed* plugin's section appears under **Community plugins**, a composed sandboxed plugin's
 * under **App plugins** — a plugin cannot masquerade as part of the app.
 */
export interface FrameSettingsSection {
  readonly id: string;
  readonly title: string;
  readonly order?: number;
  readonly rows: readonly FrameSettingRow[];
}
