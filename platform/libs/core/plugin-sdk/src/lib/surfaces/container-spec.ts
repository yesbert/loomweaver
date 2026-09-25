import { PaneArea } from './pane-area.js';

/**
 * A **container** surface ("workspace-in-a-tab"): instead of rendering one thing, the host
 * draws a nested, host-managed pane tree of **child surfaces** inside this surface's content tab —
 * the same drag/split/min/max mechanics as the top level, one level nested and scoped to
 * the parent tab instance. A container is always `routable` (it holds its own `:id`); its children are
 * non-routable surfaces mounted off-router, each receiving the container's route params (its `:id`).
 */
export interface ContainerSpec {
  /**
   * The child surfaces this container may hold — a bare surface id, or the object form when the child
   * should also carry an **address** inside the container (see {@link ContainerChildEntry.segment}).
   * The list is what the inner "new tab" picker offers, access-gated and without the children a
   * plugin left out with `ctx.setChildShown`.
   */
  readonly children: readonly ContainerChild[];
  /**
   * How the tree looks when a container tab is opened fresh — either a plain list of child surface
   * ids, which is shorthand for one tabs area, or an arrangement in the {@link PaneArea} grammar:
   *
   * ```ts
   * initial: {
   *   columns: [
   *     { size: 60, tabs: ['quotes.positions'] },
   *     { size: 40, rows: [{ tabs: ['quotes.customer'] }, { tabs: ['quotes.margin'] }] },
   *   ],
   * }
   * ```
   *
   * A container whose path carries an `:id` needs this: its tree is keyed per instance, so no user
   * gesture can ever become the default for the next one. The declaration applies whenever the tab
   * is opened fresh; while it stays open the user's own arrangement wins.
   *
   * Every named child must also be listed in {@link children} — an entry that is not is dropped with
   * a developer warning, as is a structurally invalid area. A child the current user may not see is
   * still laid out and shows the host's access placeholder in its pane, so a session that has not
   * arrived yet cannot flatten the declared layout. A child the plugin left out with
   * `ctx.setChildShown` shows neither, and keeps its place for when it comes back.
   */
  readonly initial?: readonly string[] | ContainerArea;
}

/** A container child — a bare surface id, or the object form for a child that carries an address. */
export type ContainerChild = string | ContainerChildEntry;

export interface ContainerChildEntry {
  /** The child surface id. */
  readonly surface: string;
  /**
   * The child's address **inside** this container, in Angular path syntax, so it may carry values:
   * `'list'`, `'entry/:entryId'`. Declaring one turns the child into something a sibling can open
   * several times over — a list child opens `entry/e-01` and `entry/e-02` as two tabs, each its own
   * pane if the user splits them, each with its own `VIEW_STATE`, all of it surviving a reload
   * because it lives in the container's tree.
   *
   * The address is **relative**: it means nothing outside this container, which is what lets the same
   * child surface serve several containers under different names, and what keeps the container
   * sealed. While the container tab holds the browser address, the URL shows the focused child
   * (`/runs/abc123/verdict`); in a split pane or a pop-out the child stays put and the address simply
   * does not express it.
   *
   * Without a segment the child is reachable from the inner picker, one instance, with no address.
   *
   * A child whose segment carries a value cannot be seeded in {@link ContainerSpec.initial} or offered
   * by the picker — neither knows what value to use. It is opened by a sibling, which is the point.
   * Declare a pane as `{ tabs: [] }` to say where those children land.
   */
  readonly segment?: string;
}

/** A container's initial arrangement — the {@link PaneArea} grammar over child surface ids. */
export type ContainerArea = PaneArea<ContainerTabEntry>;

/** A tab in a container declaration — a child surface id, or the object form for the extra flags. */
export type ContainerTabEntry = string | ContainerTab;

export interface ContainerTab {
  /** The child surface id the tab mounts; it must be listed in {@link ContainerSpec.children}. */
  readonly surface: string;
  /**
   * `false` keeps the tab: it shows no close affordance, and "close others" and "close all" spare
   * it. Only closing is refused — the user still reorders it and drags it to another pane of the
   * container.
   */
  readonly closable?: boolean;
  /** Marks the area's initially active tab; without it the first tab is active. */
  readonly active?: boolean;
}
