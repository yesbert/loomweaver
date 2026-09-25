import {
  PaneArea,
  PaneAreaBase,
  PaneColumnArea,
  PaneRowArea,
  PaneTabArea,
} from '@loomweaver/plugin-sdk';

/**
 * A developer-defined workspace a distribution ships with {@link provideWorkspaces}: the same thing a
 * user can build and save, only its baseline lives in code — it is never written to storage, the user
 * cannot overwrite, rename or delete it, and it moves with product updates. Switching, the automatic
 * per-workspace working state and **Reset** (back to this declaration) work exactly as for a
 * user-saved workspace.
 */
export interface WorkspaceDefinition {
  /**
   * Stable identity — keys the workspace's working state. `default` is reserved for the built-in
   * empty workspace; a duplicate id keeps the first declaration.
   */
  readonly id: string;
  /** Display name — a translation key; a literal string falls back to itself. */
  readonly title: string;
  /** Optional icon (registry name) shown next to the name in the workspace management UI. */
  readonly icon?: string;
  /**
   * Makes this the workspace the application opens in, instead of the empty `default` one. It holds
   * for **every** opening at an address that names no content, not only the first, and shows the
   * workspace as the user last left it rather than as declared; what they built elsewhere keeps
   * everything, one switch away. The opening replaces the entry in the browser's history, so going
   * back does not return to the bare address. A deep link still wins over the declaration, and a
   * workspace claiming that address is the one the visitor starts in. A declaration that names no
   * content of its own leaves both the address and the active workspace alone, so whatever the
   * distribution serves at the bare address is what shows. If two declarations set this, the first
   * one wins, as with a duplicate id.
   *
   * It also makes this the **default** workspace. The empty built-in one is then not offered or
   * counted anywhere, removing the saved workspace the user is in leads here, and a user whose stored
   * choice was the built-in one starts here; what they had arranged there is not carried over.
   */
  readonly initial?: boolean;
  /**
   * Which views each sidebar shows, keyed by the **panel region id** of your layout. A listed region
   * shows exactly the named views; everything else declared for it is hidden and can be brought back
   * through the strip's context menu. List a region with an **empty array** to show none of its views
   * — the sidebar itself stays, empty. A region you leave out, or omitting the whole field, keeps
   * whatever the user has there. **Whether a sidebar exists, is open and how wide it is belongs to the
   * window, not to the workspace**: your layout decides which sidebars the app has, the user decides
   * whether they are open, and switching workspaces never collapses, resizes or removes one.
   */
  readonly sidebars?: Readonly<Record<string, readonly string[]>>;
  /**
   * The content addresses that belong to this workspace, as route paths in the same vocabulary as
   * {@link content} — `quotes/:id` claims every quote document and everything below one. Reaching a
   * claimed address activates this workspace and shows the content inside it, **however the address
   * was reached**: a link followed into the application, a restart, a command, a programmatic
   * navigation or a tab a plugin opened. Without a claim an address is shown wherever the user
   * already is, which is the behaviour of every workspace that declares none.
   *
   * Where claims of two workspaces meet on an address and neither is narrower, that address is
   * claimed by neither, and in development a message names both; a narrower claim (more segments,
   * or fewer parameters at the same length) simply wins. A workspace the **user** saved is never a
   * destination, however it came by its claim — it exists on one machine only, and an address that
   * led somewhere different for every user would not be an address.
   */
  readonly claims?: readonly string[];
  /**
   * The content area as a recursive arrangement: an area either holds `tabs`, splits into `rows`
   * (top to bottom) or splits into `columns` (left to right). The **first** tabs area in reading
   * order becomes the URL pane; switching to the workspace navigates to its active tab. Omit to
   * start on the empty layout.
   */
  readonly content?: WorkspaceArea;
}

/**
 * One node of a {@link WorkspaceDefinition} content declaration — the shared {@link PaneArea} grammar
 * over route paths. A container declares its own arrangement in the same grammar over
 * child surface ids.
 */
export type WorkspaceArea = PaneArea<WorkspaceTabEntry>;

export type WorkspaceAreaBase = PaneAreaBase;

/** An area that holds tabs. */
export type WorkspaceTabArea = PaneTabArea<WorkspaceTabEntry>;

/** An area that splits into rows, top to bottom. */
export type WorkspaceRowArea = PaneRowArea<WorkspaceTabEntry>;

/** An area that splits into columns, left to right. */
export type WorkspaceColumnArea = PaneColumnArea<WorkspaceTabEntry>;

/** A tab in a workspace declaration — a route path, or the object form for the extra flags. */
export type WorkspaceTabEntry = string | WorkspaceTab;

export interface WorkspaceTab {
  /** The surface route path the tab opens (sidebar views belong under `sidebars`, not here). */
  readonly path: string;
  /**
   * `false` keeps the tab in this workspace: it shows no close affordance, and "close others" and
   * "close all" spare it. Only closing is refused — the user still reorders it and drags it to
   * another pane. Reset restores it either way.
   */
  readonly closable?: boolean;
  /** Marks the area's initially active tab; without it the first tab is active. */
  readonly active?: boolean;
}
