import { Disposable } from './disposable.js';
import { PluginState } from './plugin-state.js';
import { BarItem } from '../chrome/bar-item.js';
import { MenuItem } from '../chrome/menu.js';
import { RailItem } from '../chrome/rail-item.js';
import { SettingsSection } from '../chrome/settings-section.js';
import { CommandArguments } from '../commands/command-arguments.js';
import {
  CommandOutcome,
  InvocableCommand,
} from '../commands/command-invocation.js';
import { Command } from '../commands/command.js';
import {
  ActiveContent,
  PluginHost,
  PluginSession,
  PluginUi,
} from '../host-ui/host-services.js';
import {
  ContentTabLabel,
  OpenTabInput,
  TabBadge,
} from '../surfaces/content-tab.js';
import { Surface } from '../surfaces/surface.js';
import { ViewAction } from '../surfaces/view.js';

/**
 * The `ctx` a plugin uses to contribute to the host — one uniform contract. A trusted plugin gets a
 * host-backed implementation; a sandboxed plugin gets the same surface over RPC.
 */
export interface PluginContext {
  /**
   * Registers a named, invocable {@link Command}. Triggers — rail/bar/
   * view-action items (via `command: <id>`), keybindings, and the command palette — reference it
   * by id, so one behaviour has many entry points.
   *
   * Needs the `contributions` capability.
   */
  registerCommand(command: Command): Disposable;
  /**
   * Registers a {@link Surface} — the **one** author contract for anything the host renders.
   * Declare *what the surface can do* (`routable`, `instanceable`, `docks`) rather than *where it lives*;
   * the host places it (a routable surface into the content area, else into its home dock) and the user
   * re-arranges it from there.
   *
   * Needs the `contributions` capability, and `navigation` as well for a `rest` route whose path has
   * fewer than two segments, since such a route claims most of the address space.
   */
  registerSurface(surface: Surface): Disposable;
  /**
   * Gives a surface you registered a new title, under the id you registered it with.
   * Everywhere the workbench names it follows — its tab, the header of the panel it is docked in, a
   * picker that lists it — and the surface itself is **not** rebuilt, so what the user typed,
   * scrolled or folded inside it survives. A translation key still translates, and follows a
   * language change. Only the title changes; an id you did not register is a no-op.
   *
   * Needs the `contributions` capability.
   */
  retitleSurface(id: string, title: string): void;
  /**
   * Replaces one action of a surface you registered, under the surface's id and the action's `id`.
   * Wherever the workbench draws that surface's actions follows, the header of the
   * panel it is docked in first among them, and the surface itself is **not** rebuilt. An action id
   * the surface did not carry is added, in the place its `order` gives it. This is how a toggle
   * moves: replace it with the opposite {@link ViewAction.pressed} when its state changes. Only that
   * one action changes; a surface id you did not register is a no-op. A sandboxed surface carries no
   * actions, so there is nothing on it to replace.
   *
   * Needs the `contributions` capability.
   */
  updateSurfaceAction(id: string, action: ViewAction): void;
  /**
   * Gives a surface you registered a badge, replaces it, or takes it away with `null`, under the id you
   * registered it with. Every tab that shows the surface follows, and the surface
   * itself is **not** rebuilt. A text given as a translation key still translates, and follows a
   * language change. Only the badge changes; an id you did not register is a no-op. A content tab
   * opened with a badge of its own keeps its own.
   *
   * Needs the `contributions` capability.
   */
  updateSurfaceBadge(id: string, badge: TabBadge | null): void;
  /**
   * Leaves a child of a container out, or brings it back, under the id of the child surface you
   * registered. A child left out is absent from every container that lists it: no
   * tab, no placeholder, not walked by the keyboard, not offered by a pane's picker, not closed by
   * closing in bulk; an address naming it opens the container on a child that is shown. It
   * keeps its place, so brought back it stands where it stood, and what the user arranged around it
   * stays. The decision is yours, for any reason (a setting, a licence, your own state), not a role.
   * A child is shown unless left out; an id that is not a container child you registered is a no-op.
   *
   * Needs the `contributions` capability.
   */
  setChildShown(childSurfaceId: string, shown: boolean): void;
  /**
   * Places an item in a bar region: a button that runs a command or opens a menu, or a component of
   * your own.
   *
   * Needs the `contributions` capability.
   */
  registerBarItem(item: BarItem): Disposable;
  /**
   * Places an item on a rail: an icon that runs a command, opens a menu or switches to a workspace.
   *
   * Needs the `contributions` capability.
   */
  registerRailItem(item: RailItem): Disposable;
  /**
   * Contributes a section to the host settings surface.
   *
   * Needs the `contributions` capability.
   */
  registerSettingsSection(section: SettingsSection): Disposable;
  /**
   * Contributes an item to a named menu slot — e.g. add an action to the tab context menu
   * (`'content/tab/context'`) or a plugin's own slot. The item names a {@link Command} by id (invoked with
   * the menu's {@link MenuContext}) and may declare a coarse `when` filter. The host draws the menu.
   *
   * Needs the `contributions` capability.
   */
  registerMenuItem(item: MenuItem): Disposable;
  /**
   * Contributes custom icon names the plugin can then reference in its contributions
   * (`Command.icon` / `Surface.icon` / `RailItem.icon` / `BarButtonItem.icon`). Each value
   * is a raw SVG string (an `@ng-icons` export or hand-authored markup). Names are flat and
   * collision-safe: a name already registered by the shell or another plugin is ignored (first-wins,
   * dev-warned), so pick unique names. The returned {@link Disposable} removes exactly these names.
   *
   * Needs the `contributions` capability.
   */
  contributeIcons(icons: Readonly<Record<string, string>>): Disposable;
  /**
   * Contributes design tokens (`--lw-*` custom properties) that re-skin the whole app — host chrome and
   * every other plugin, since all read the same tokens. The vocabulary covers colors and the
   * UI font (`--lw-font-sans` / `--lw-font-mono`); font *size* is a user preference, not a theme token.
   * Only whitelisted `--lw-*` names apply; unknown names are ignored. Contributed tokens sit **below** any
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
   *
   * Needs the `theme` capability.
   */
  contributeTheme(
    tokens: Readonly<Record<string, string>>,
    dark?: Readonly<Record<string, string>>,
  ): Disposable;
  /**
   * Navigates the content area to a route path — switches perspective / full-area view.
   *
   * Needs the `navigation` capability.
   */
  navigateContent(path: string): void;
  /**
   * Opens a titled **dynamic** tab (e.g. an open document) for `path` and navigates to it; opening
   * the same path again just re-activates it. Set `titleIsLiteral` for a
   * non-translatable title, `onClose` to free per-tab state when the tab is closed, and `preview` to
   * open it as a single reused *preview* slot (see {@link OpenTabInput}).
   *
   * Where the product has given the address to a workspace of its own, that workspace is activated
   * first and the tab opens there, so a document is never laid over an arrangement built for
   * something else. The call still returns at once; the tab appears when the switch has happened.
   *
   * Needs the `navigation` capability.
   */
  openContentTab(input: OpenTabInput): void;
  /**
   * Promotes the **preview** tab rooted at `path` to a permanent tab — the programmatic
   * "Keep Open", e.g. bound to a double-click or fired when the content is edited. A no-op if the tab
   * is already permanent or not open.
   *
   * Needs the `navigation` capability.
   */
  keepContentTab(path: string): void;
  /**
   * **Pins** the dynamic tab rooted at `path`: the host sorts it to the front of its
   * group and guards it against accidental close (its close control becomes an unpin control).
   * Pinning also promotes a preview tab. A no-op if the tab is not open.
   *
   * Needs the `navigation` capability.
   */
  pinContentTab(path: string): void;
  /**
   * Unpins the tab rooted at `path` — it returns to a normal, closable tab. No-op otherwise.
   *
   * Needs the `navigation` capability.
   */
  unpinContentTab(path: string): void;
  /**
   * Closes a dynamic content tab by path; the host activates a neighbour.
   *
   * Needs the `navigation` capability.
   */
  closeContentTab(path: string): void;
  /**
   * Changes the title, icon or badge of the **open** content tab rooted at `path`, where it stands,
   * without bringing it forward: the tab in front, the focus and the address stay as they are, and a
   * tab in another pane of the main area changes there. What `label` leaves out
   * stays, and `badge: null` takes the tab's own badge away; the change is kept like a label the tab
   * was opened with. It never opens a tab: for a path with no open tab it does nothing, and a tab
   * whose content another plugin registered is left alone. Use it to keep a badge true while the
   * content changes behind the tab the user is looking at.
   *
   * Needs the `contributions` capability.
   */
  updateContentTab(path: string, label: ContentTabLabel): void;
  /**
   * Reveals an already-**docked** surface by id: activates its tab wherever the user
   * has placed it — a sidebar panel (expanding a collapsed one) or a content pane — so a command
   * like "Focus Library" can bring a docked view to the front. Routable surfaces are reached via
   * {@link navigateContent} instead; container-only children (`docks: []`) live inside their
   * container and are not revealed from here. A no-op for an unknown or un-placed id.
   *
   * Needs the `navigation` capability.
   */
  revealSurface(id: string): void;
  /**
   * Signal-shaped read of the {@link ActiveContent} — which routable surface the URL pane
   * currently shows, with its path parameters. The read side of the content area:
   * a panel that reacts to "which tab is focused" (an inspector, a details view) reads
   * this instead of injecting the host's router and parsing URLs, so it stays stable across host
   * URL-shape changes. `null` when no content route matches. Only for a trusted plugin (like
   * `ui.openMenu`, it does not cross the sandbox RPC boundary — a sandboxed surface already receives
   * its own state over the surface channel).
   *
   * Needs the `navigation` capability.
   */
  readonly activeContent: () => ActiveContent | null;
  /**
   * Whether what the workbench is showing sits at, or below, the address you name.
   * The comparison breaks on segment boundaries, so `sales/quotes` is under `sales` and
   * `sales/quotesomething` is not: the rule a caller would otherwise write with `startsWith` and get
   * wrong. Reads {@link activeContent}, so it is live in the same way and a template re-reads it.
   *
   * Needs the `navigation` capability.
   */
  isShowingUnder(path: string): boolean;
  /**
   * Whether the surface at `path` holds **unsaved work** — the same fact the workbench draws as a
   * mark on the tab, so that a plugin can show it where the workbench cannot reach: the row in the
   * list a document was opened from, a count beside a group, a badge of its own. An arrangement
   * answers for what is inside it, so a document whose panel is dirty reads `true` at the
   * document's own address.
   *
   * It is a **reactive read**: call it in a template or a `computed` and the reader follows the
   * work being saved without further wiring. `false` for an address with nothing open, because a
   * surface holding unsaved work is never destroyed while it does.
   *
   * Bounded to **your own** surfaces, on the same ground as running a command you registered
   * yourself: a surface another plugin registered reads `false`, whatever is happening in it. Only
   * for a trusted plugin — a sandboxed surface reports its own state over its surface channel and is
   * told about its own there.
   *
   * Needs no capability.
   */
  hasUnsavedWork(path: string): boolean;
  /**
   * Runs a registered command by id and answers what it did.
   *
   * Unlike every other member here this **answers a refusal instead of throwing one**, because a
   * caller working through a list of actions has to handle "you may not" as an outcome rather than as
   * an exception. The user is still told, exactly as they are for every other refused route.
   *
   * A refusal reads `unavailable` for every reason a command cannot be reached — no such id, not
   * {@link Command.callable}, the session does not meet its {@link Command.access}, this window does
   * not host it, the grant is missing — so that invoking ids and reading the reason back cannot map
   * what is installed.
   *
   * Needs the `automation` capability, except for a command this plugin registered itself.
   */
  invokeCommand(
    id: string,
    args?: CommandArguments,
  ): Promise<CommandOutcome>;
  /**
   * The commands this plugin may invoke that it did not register itself: the list of commands the
   * workbench would run for it, already narrowed by everything that would refuse the invocation, with
   * every text resolved to the active language. Empty without the grant, whatever is installed.
   *
   * Read it instead of keeping a list of your own: a second list is a second answer to "may this
   * run", and it is not the one the user can see and withdraw.
   *
   * Needs the `automation` capability.
   */
  readonly invocableCommands: () => readonly InvocableCommand[];
  /**
   * Host UI services: dialogs, toasts, the settings surface and ad-hoc menus.
   *
   * Needs the `ui` capability for every call.
   */
  readonly ui: PluginUi;
  /**
   * Read-only host facts and the app's lifecycle (version, update).
   *
   * Needs the `host` capability.
   */
  readonly host: PluginHost;
  /**
   * Read-only session facts (login state and roles) for gating your own contributions.
   *
   * Needs the `session` capability.
   */
  readonly session: PluginSession;
  /**
   * Your plugin's own keyed store: working state shared by all your surfaces, in every window.
   * It is plugin-private by construction, so there is nothing foreign to reach.
   *
   * Needs no capability.
   */
  readonly state: PluginState;
}
