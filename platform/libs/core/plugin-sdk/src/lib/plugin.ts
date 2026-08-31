import { PluginState } from './plugin-state.js';
import { Type } from '@angular/core';
import { Capability } from './capability.js';
import {
  Command,
  CommandArguments,
  CommandOutcome,
  InvocableCommand,
} from './command.js';
import { MenuItem } from './menu.js';
import { Disposable } from './contribution.js';
import { Surface } from './surface.js';
import { OpenTabInput } from './content-route.js';
import { BarItem } from './bar-item.js';
import { RailItem } from './rail-item.js';
import { SettingsSection } from './settings-model.js';
import { DialogRef } from './dialog-ref.js';
import {
  AlertOptions,
  ConfirmOptions,
  OpenOptions,
  ProgressHandle,
  ProgressOptions,
  PromptOptions,
} from './dialog.js';
import { NotificationInput } from './notification.js';

/** What a plugin declares about itself (grows: activation events, version, …). */
export interface PluginManifest {
  /** Stable plugin id. */
  readonly id: string;
  /** Human-readable name. */
  readonly name?: string;
  /**
   * Capabilities the plugin declares it needs. This is the *request*; the
   * distribution/tenant *grants* (default-deny, see `provideCapabilityGrants`). The effective set
   * is what was granted — a declaration alone grants nothing. The declaration is what the install
   * consent dialog shows and what the Permissions settings manage.
   */
  readonly capabilities?: readonly Capability[];
}

/**
 * One row of an ad-hoc context menu opened via {@link PluginUi.openMenu}: a display `label` (a literal —
 * the weaver localises its own body text), an optional leading `icon` (a host icon-registry name), and an
 * in-process `run` handler invoked when the row is chosen. Trusted-rung only: `run` is a function, so it
 * does not cross the sandbox RPC boundary — a sandboxed plugin draws its own `<lw-menu>` instead.
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
  confirm(options: ConfirmOptions): Promise<boolean>;
  alert(options: AlertOptions): Promise<void>;
  prompt(options: PromptOptions): Promise<string | null>;
  open<R = unknown>(component: Type<unknown>, options?: OpenOptions): DialogRef<R>;
  progress(options: ProgressOptions): ProgressHandle;
  withProgress<T>(options: ProgressOptions, work: Promise<T>): Promise<T>;
  toast(input: NotificationInput): string;
  /** Opens the host settings surface; the host renders the registered sections. */
  openSettings(): DialogRef;
  /**
   * Opens an ad-hoc context menu at a viewport point — for a right-click on the weaver's own view body
   * (a Library row, a canvas node, …). The host draws it with the same `<lw-menu>` popover mechanics as
   * its own menus (positioning, Escape/outside-pointer dismiss, focus restore). Trusted-rung only: the
   * items' `run` handlers do not cross the sandbox boundary (a sandboxed plugin self-draws a `<lw-menu>`).
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

/**
 * The `ctx` a plugin uses to contribute to the host — one uniform contract. Trusted in-process
 * plugins get a host-backed implementation; sandboxed plugins get the same surface over RPC.
 */
export interface PluginContext {
  /**
   * Registers a named, invocable {@link Command}. Triggers — rail/bar/
   * view-action items (via `command: <id>`), keybindings, and the command palette — reference it
   * by id, so one behaviour has many entry points.
   */
  registerCommand(command: Command): Disposable;
  /**
   * Registers a {@link Surface} — the **one** author contract for anything the host renders.
   * Declare *what the surface can do* (`routable`, `instanceable`, `docks`) rather than *where it lives*;
   * the host places it (a routable surface into the content area, else into its home dock) and the user
   * re-arranges it from there.
   *
   * Replaced `registerView` + `registerRoute`, removed in 0.5.0:
   * - a panel view → a non-routable surface: `registerSurface({ id, title, docks: ['<regionId>'], component })`
   * - a content route → a routable surface: `registerSurface({ id, title, routable: { path }, component })`
   *
   * Both migrations need an `id` and a `title`, which the old contracts did not carry.
   */
  registerSurface(surface: Surface): Disposable;
  registerBarItem(item: BarItem): Disposable;
  registerRailItem(item: RailItem): Disposable;
  /** Contributes a section to the host settings surface. */
  registerSettingsSection(section: SettingsSection): Disposable;
  /**
   * Contributes an item to a named menu slot — e.g. add an action to the tab context menu
   * (`'content/tab/context'`) or a plugin's own slot. The item names a {@link Command} by id (invoked with
   * the menu's {@link MenuContext}) and may declare a coarse `when` filter. The host draws the menu.
   */
  registerMenuItem(item: MenuItem): Disposable;
  /**
   * Contributes custom icon names the weaver can then reference in its contributions
   * (`Command.icon` / `View.icon` / `RailItem.icon` / `BarButtonItem.icon`). Each value
   * is a raw SVG string (an `@ng-icons` export or hand-authored markup). Names are flat and
   * collision-safe: a name already registered by the shell or another plugin is ignored (first-wins,
   * dev-warned), so pick unique names. The returned {@link Disposable} removes exactly these names.
   */
  contributeIcons(icons: Readonly<Record<string, string>>): Disposable;
  /**
   * Contributes design tokens (`--lw-*` custom properties) that re-skin the whole app — host chrome and
   * every other plugin, since all read the same tokens. The vocabulary covers colors and the
   * UI font (`--lw-font-sans` / `--lw-font-mono`); font *size* is a user preference, not a theme token.
   * Requires the `theme` capability. Only
   * whitelisted `--lw-*` names apply; unknown names are ignored. Contributed tokens sit **below** any
   * tenant/distribution branding in the cascade (Tenant > Plugin > Product), so a plugin themes freely
   * but never overrides a token the tenant explicitly set. Collisions across plugins are first-wins:
   * the plugin that contributes a token first owns it in **both** schemes, so a later plugin cannot
   * take over just its dark value. The returned {@link Disposable} removes exactly these tokens and
   * the app reverts.
   *
   * `tokens` apply in both light and dark mode. Pass the optional `dark` map to override specific
   * tokens only when dark mode is active — e.g. warm dark surfaces while `tokens` carries
   * the light palette. Dark overrides win over `tokens` in dark mode; tokens absent from `dark` keep
   * their `tokens` value across both modes.
   */
  contributeTheme(
    tokens: Readonly<Record<string, string>>,
    dark?: Readonly<Record<string, string>>,
  ): Disposable;
  /** Navigates the content area to a route path — switches perspective / full-area view (`navigation`). */
  navigateContent(path: string): void;
  /**
   * Opens a titled **dynamic** tab (e.g. an open document) in the content group of the path's
   * matched route (navigating there activates that group) and navigates to it; opening the same
   * path again just re-activates it (`navigation`). Set `titleIsLiteral` for a
   * non-translatable title, `onClose` to free per-tab state when the tab is closed, and `preview` to
   * open it as a single reused *preview* slot (see {@link OpenTabInput}).
   *
   * Where the product has given the address to a workspace of its own, that workspace is activated
   * first and the tab opens there, so a document is never laid over an arrangement built for
   * something else. The call still returns at once; the tab appears when the switch has happened.
   */
  openContentTab(input: OpenTabInput): void;
  /**
   * Promotes the **preview** tab rooted at `path` to a permanent tab — the programmatic
   * "Keep Open", e.g. bound to a double-click or fired when the content is edited. A no-op if the tab
   * is already permanent or not open (`navigation`).
   */
  keepContentTab(path: string): void;
  /**
   * **Pins** the dynamic tab rooted at `path`: the host sorts it to the front of its
   * group and guards it against accidental close (its close control becomes an unpin control).
   * Pinning also promotes a preview tab. A no-op if the tab is not open (`navigation`).
   */
  pinContentTab(path: string): void;
  /** Unpins the tab rooted at `path` — it returns to a normal, closable tab. No-op otherwise (`navigation`). */
  unpinContentTab(path: string): void;
  /** Closes a dynamic content tab by path; the host activates a neighbour (`navigation`). */
  closeContentTab(path: string): void;
  /**
   * Reveals an already-**docked** surface by id (finding #29): activates its tab wherever the user
   * has placed it — a sidebar panel (expanding a collapsed one) or a content pane — so a command
   * like "Focus Library" can bring a docked view to the front. Routable surfaces are reached via
   * {@link navigateContent} instead; container-only children (`docks: []`) live inside their
   * container and are not revealed from here. A no-op for an unknown or un-placed id (`navigation`).
   */
  revealSurface(id: string): void;
  /**
   * Signal-shaped read of the {@link ActiveContent} — which routable surface the URL pane
   * currently shows, with its path parameters (`navigation`). The read side of the content area
   *: a panel that reacts to "which tab is focused" (an inspector, a details view) reads
   * this instead of injecting the host's router and parsing URLs, so it stays stable across host
   * URL-shape changes. `null` when no content route matches. Trusted rung only (like `ui.openMenu`,
   * it does not cross the sandbox RPC boundary — a sandboxed surface already receives its own state
   * over the surface channel).
   */
  readonly activeContent: () => ActiveContent | null;
  /**
   * Runs a registered command by id and answers what it did (`automation`, unless the command is
   * one this plugin registered itself — its own need no grant).
   *
   * Unlike every other member here this **answers a refusal instead of throwing one**, because a
   * caller working through a list of actions has to handle "you may not" as an outcome rather than as
   * an exception. The user is still told, exactly as they are for every other refused route.
   *
   * A refusal reads `unavailable` for every reason a command cannot be reached — no such id, not
   * {@link Command.callable}, the session does not meet its {@link Command.access}, this window does
   * not host it, the grant is missing — so that invoking ids and reading the reason back cannot map
   * what is installed.
   */
  invokeCommand(
    id: string,
    args?: CommandArguments,
  ): Promise<CommandOutcome>;
  /**
   * The commands this plugin may invoke that it did not register itself (`automation`) — the
   * workbench's own account, already narrowed by everything that would refuse the invocation, with
   * every text resolved to the active language. Empty without the grant, whatever is installed.
   *
   * Read it instead of keeping a list of your own: a second list is a second answer to "may this
   * run", and it is not the one the user can see and withdraw.
   */
  readonly invocableCommands: () => readonly InvocableCommand[];
  /** Host UI services (dialogs, toasts). */
  readonly ui: PluginUi;
  /** Read-only host facts + app-lifecycle (version, update). */
  readonly host: PluginHost;
  /** Read-only session facts (login state + roles) for self-gating (gated by `session`). */
  readonly session: PluginSession;
  /**
   * Your plugin's own keyed store — working state shared by all your surfaces, in every window
   *. Ungated: it is plugin-private by construction, so there is nothing foreign to reach.
   */
  readonly state: PluginState;
}

/** A LoomWeaver plugin: declares itself and contributes on activation. */
export interface Plugin {
  readonly manifest: PluginManifest;
  activate(ctx: PluginContext): void | Promise<void>;
  deactivate?(): void;
}
