/**
 * A navigable content target the command palette's Quick-Open mode lists:
 * a registered surface reachable by plain navigation (a parameterless, non-chromeless route), or a
 * currently **open** tab — across every workspace pane. `lastActive` is a session-only epoch stamp of
 * when the target was last the active tab — it is not persisted (a fresh window starts with no
 * times), and it floats recently visited targets up.
 */
export interface QuickOpenTarget {
  /** The tab root — stable identity and the `tabId` for the tab context menu. */
  readonly path: string;
  /** The full path to navigate to (open: root + remembered sub-route; else the route path). */
  readonly navPath: string;
  readonly title: string;
  readonly literalTitle: boolean;
  readonly icon?: string;
  readonly pinned: boolean;
  /** A target that is not an open tab is not closable — the context menu hides Close/Split/Pin. */
  readonly closable: boolean;
  readonly lastActive?: number;
}
