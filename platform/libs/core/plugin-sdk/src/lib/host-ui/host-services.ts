import { Type } from '@angular/core';
import { DialogRef } from '../dialog-ref.js';
import {
  AlertOptions,
  ConfirmOptions,
  OpenOptions,
  ProgressHandle,
  ProgressOptions,
  PromptOptions,
} from '../dialog.js';
import { NotificationInput } from '../notification.js';

/**
 * One row of an ad-hoc context menu opened via {@link PluginUi.openMenu}: a display `label` (a translation
 * key of the weaver's own bundle or a literal; it is looked up as a key, a label no bundle knows is shown
 * as it is, and a key is re-worded in the open menu when the strings arrive or the language changes), an
 * optional leading `icon` (a host icon-registry name), and an in-process `run` handler invoked when the
 * row is chosen.
 * Trusted-rung only: `run` is a function, so it does not cross the sandbox RPC boundary. A sandboxed
 * plugin draws its own `<lw-menu>` instead.
 */
export interface UiMenuItem {
  readonly label: string;
  readonly icon?: string;
  readonly run: () => void;
}

/**
 * Host UI services a plugin reaches through `ctx.ui`: modal
 * dialogs + transient toasts. This is the brokered path that replaces injecting the host
 * services directly; the `ui` capability gate (default-deny) is enforced in front
 * of it — a call without the grant throws.
 */
export interface PluginUi {
  /** Asks a yes-or-no question; resolves `true` only if the user confirmed. */
  confirm(options: ConfirmOptions): Promise<boolean>;
  /** Shows a message with a single acknowledge button; resolves when it is closed. */
  alert(options: AlertOptions): Promise<void>;
  /** Asks for a line of text; resolves the text, or `null` when the user cancelled. */
  prompt(options: PromptOptions): Promise<string | null>;
  /** Opens a dialog whose body is your component; the host draws the frame and the footer. */
  open<R = unknown>(
    component: Type<unknown>,
    options?: OpenOptions,
  ): DialogRef<R>;
  /** Shows a busy indicator the user cannot dismiss; close it through the returned handle. */
  progress(options: ProgressOptions): ProgressHandle;
  /** Shows a busy indicator while `work` runs, and closes it when `work` settles. */
  withProgress<T>(options: ProgressOptions, work: Promise<T>): Promise<T>;
  /** Shows a transient notice and returns its id; a later toast with the same id replaces it. */
  toast(input: NotificationInput): string;
  /** Opens the host settings surface; the host renders the registered sections. */
  openSettings(): DialogRef;
  /**
   * Opens an ad-hoc context menu at a viewport point — for a right-click on the plugin's own view body
   * (a Library row, a canvas node, …). The host draws it with the same `<lw-menu>` popover mechanics as
   * its own menus (positioning, Escape/outside-pointer dismiss, focus restore). Only for a trusted
   * plugin: the items' `run` handlers do not cross the sandbox boundary (a sandboxed plugin draws its
   * own `<lw-menu>`).
   */
  openMenu(items: readonly UiMenuItem[], at: { x: number; y: number }): void;
}

/**
 * Read-only host facts + app-lifecycle a plugin reaches through `ctx.host` —
 * so a plugin's About surface gets the version + update state through the brokered `ctx`
 * instead of importing host services directly. `version`/`updateAvailable` are signal-shaped
 * (`() => T`) so a template re-reads them reactively.
 */
export interface PluginHost {
  /** The running app version (e.g. "1.2.3"). */
  readonly version: () => string;
  /**
   * Whether {@link version} is a preview of a line that has not been released — `0.8.0-preview.3`
   * rather than `0.7.9`. Ask this instead of taking the version apart yourself.
   *
   * **Announcing it is yours.** The host marks a preview nowhere on its own: how loudly a product
   * tells its users that it is running something unfinished is the product's judgement, the same
   * way showing the version at all is.
   */
  readonly isPreview: () => boolean;
  /** True once a new version is downloaded and ready to activate. */
  readonly updateAvailable: () => boolean;
  /** Whether update checks are possible (a service worker is registered and enabled). */
  readonly updatesEnabled: boolean;
  /** Manually check for a new version. */
  checkForUpdate(): Promise<void>;
  /** Activate the downloaded version and reload into it. */
  activateUpdate(): Promise<void>;
}

/**
 * Read-only session facts a plugin reaches through `ctx.session` — so a plugin can gate its
 * **own** surface/logic by the signed-in user's login state and roles, the imperative counterpart to the
 * declarative `access` on contributions. LoomWeaver owns no auth: this only reflects the snapshot the
 * distribution supplied (`provideAuthSource`). Signal-shaped (`() => T`) so a template re-reads reactively;
 * roles are opaque strings — match, do not interpret. The snapshot's claim bag does not arrive here:
 * a plugin is told the login state and the roles, and nothing else. Client-side gating is
 * presentation, not security. Gated by the `session` capability (default-deny).
 */
export interface PluginSession {
  /** Whether someone is signed in. */
  readonly authenticated: () => boolean;
  /** The current principal's roles (empty when anonymous). */
  readonly roles: () => readonly string[];
  /** Convenience: whether the current principal holds `role`. */
  hasRole(role: string): boolean;
}

/**
 * The content the URL pane currently shows — the read side of the content area a plugin reaches
 * through `ctx.activeContent`. Path parameters are extracted against the matched
 * route's pattern (`ask/:id` on `ask/abc` → `{ id: 'abc' }`), so a plugin never parses URLs.
 */
export interface ActiveContent {
  /** The matched surface's id, or `null` when the matched route carries none. */
  readonly surfaceId: string | null;
  /** The full active content path (no leading slash), including any sub-route segment. */
  readonly path: string;
  /** The `:param` values of the matched route pattern (empty for parameter-less routes). */
  readonly params: Readonly<Record<string, string>>;
}
