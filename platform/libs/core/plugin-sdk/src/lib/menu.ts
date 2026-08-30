/**
 * The **serialisable** context an opener passes when it shows a menu — e.g. the tab strip
 * passes `{ targetKind: 'content-tab', tabId, group, pinned, closable }`. Primitives only, so it crosses
 * the sandbox RPC boundary and reaches a command's `run(context)` intact. It is both the payload handed to
 * the invoked command **and** what {@link MenuItem.when} is matched against for visibility.
 */
export type MenuContext = Readonly<Record<string, string | number | boolean>>;

/**
 * A contribution to a named menu slot — the menu analogue of a rail/bar/view-action item: it
 * names a {@link menu} slot and points at a {@link command} by id (so it serialises across the sandbox
 * boundary), or carries an inline {@link run} (trusted, in-process only). The host draws the menu; a
 * right-click on host chrome opens the slot with a {@link MenuContext}.
 */
export interface MenuItem {
  /**
   * Optional stable identity. With an `id`, registering again **replaces** the entry (last-in wins — the
   * same override-by-id rule as every other contribution), and a distribution can drop it via
   * `provideShell({ omit: [id] })`. Built-in host entries use `menu:<commandId>` (e.g.
   * `menu:shell.tab.closeOthers`) — distinct from the command id, so omitting the entry keeps the command
   * itself (palette/shortcut) alive. Without an `id` the item is purely additive.
   */
  readonly id?: string;
  /** Slot id: a host slot (`'content/tab/context'`) or a plugin's own (`'<weaver>.<surface>/context'`). */
  readonly menu: string;
  /** The behaviour: a registered command id (preferred — crosses the RPC boundary), invoked with the context. */
  readonly command?: string;
  /** Inline behaviour (trusted in-process only; a sandboxed plugin uses `command` instead). */
  run?(context?: MenuContext): void;
  /** Label — Transloco key or literal. Defaults to the referenced command's title when omitted. */
  readonly title?: string;
  /** Group id for ordering + separators; groups render in `group` order, items in `order` within a group. */
  readonly group?: string;
  /** Lower renders first (default 0). */
  readonly order?: number;
  /**
   * Coarse visibility filter: the item shows only when **every** key here equals the same key
   * in the opener's {@link MenuContext} (a subset match). Omit to always show. No expression language — a
   * data-only predicate, so it is serialisable and sandbox-safe.
   */
  readonly when?: MenuContext;
  /**
   * Makes this a **checkbox** menu item (`role="menuitemcheckbox"`): present ⇒ the item shows a
   * check indicator, checked exactly when every key here equals the same key in the opener's context (a
   * subset match, like {@link when}). Lets one toggle item replace a pair (e.g. "Pinned ✓" instead of
   * separate Pin/Unpin); the referenced command reads the current state from the context and flips it.
   */
  readonly checkedWhen?: MenuContext;
}

/**
 * Which gesture opens the menu slot a chrome item names: its context menu on right-click (the
 * default), its primary activation — a click, Enter or Space — with the menu anchored to the
 * control the host drew, or both.
 *
 * Activation opens the item's **own** slot alone: the workbench's entries for that item, such as
 * the ones that hide or move it, stay on the right-click, where a curation entry beside "Sign out"
 * would be noise. An item whose activation opens its menu needs no `command` or `run` of its own,
 * and the host draws it all the same.
 */
export type MenuTrigger = 'context' | 'primary' | 'both';

/**
 * A heading for a menu, naming the thing it was opened against — an account, a document, a tenant.
 * The host draws it above the first entry of a menu opened by ACTIVATION (see {@link MenuTrigger});
 * a menu opened at the pointer carries none, because what it acts on is under the pointer.
 *
 * It is not an entry: it cannot be focused or activated, and the keyboard passes over it the way it
 * passes over a separator. The menu is announced by what it names, so the name reaches the user
 * exactly once.
 */
export interface MenuHeader {
  /** The name — Transloco key or literal. */
  readonly title: string;
  /** A second line under the name, for an address, a role or a tenant — key or literal. */
  readonly detail?: string;
  /** Icon name drawn beside the name, resolved by the host icon registry. */
  readonly icon?: string;
  /**
   * One or two letters the host draws **instead of** {@link icon}, for a name that is the user's
   * rather than yours. Same rule as a launcher entry's: keep it to two characters.
   */
  readonly initials?: string;
}
