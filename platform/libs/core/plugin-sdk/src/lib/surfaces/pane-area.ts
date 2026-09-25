/**
 * The grammar for a **declared** pane arrangement, generic over what one of its tabs addresses.
 *
 * An area either holds `tabs`, splits into `rows` (top to bottom) or splits into `columns` (left to
 * right) — exactly one of the three. It is the same vocabulary wherever a product or a plugin writes
 * an arrangement down, so there is one grammar to learn and one conversion behind it: a distribution
 * instantiates it over **route paths** for a workspace (`WorkspaceArea` in `@loomweaver/shell`), a plugin
 * over **child surface ids** for a container (`ContainerArea`).
 */
export type PaneArea<T> = PaneTabArea<T> | PaneRowArea<T> | PaneColumnArea<T>;

export interface PaneAreaBase {
  /**
   * Optional share of the parent split in percent. Unspecified siblings share the remainder evenly;
   * values that do not sum to 100 are normalized proportionally rather than rejected.
   */
  readonly size?: number;
}

/** An area that holds tabs. */
export interface PaneTabArea<T> extends PaneAreaBase {
  readonly tabs: readonly T[];
}

/** An area that splits into rows, top to bottom. */
export interface PaneRowArea<T> extends PaneAreaBase {
  readonly rows: readonly PaneArea<T>[];
}

/** An area that splits into columns, left to right. */
export interface PaneColumnArea<T> extends PaneAreaBase {
  readonly columns: readonly PaneArea<T>[];
}
