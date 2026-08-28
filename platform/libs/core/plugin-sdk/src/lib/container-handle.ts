import { InjectionToken } from '@angular/core';

/**
 * What a container child can ask of the container it sits in. Injected by a child
 * surface, so that a list child can open the item a row stands for in a sibling pane.
 *
 * It is a host operation rather than a navigation on purpose. A container tab may sit in a split
 * pane or in a pop-out, where it holds no browser address at all, and a list whose rows only work
 * while its container happens to hold the URL would not be a list. While the container *does* hold
 * the address, the URL follows and shows the focused child; elsewhere the child opens just the same
 * and the address simply does not express it.
 *
 * Only a **docked** surface mounted inside a container receives one; anywhere else the token resolves
 * to `null`, so a surface that can appear in both places checks before it calls.
 */
export interface ContainerHandle {
  /**
   * Open a child at an address inside this container, or focus it where it already is. The path is
   * the child's declared segment with its values filled in — `open('item/42')` for a child declared
   * as `{ surface: 'app.item', segment: 'item/:itemId' }`.
   *
   * It lands in the pane the container declared empty (`{ tabs: [] }`), which is what declaring one
   * says; without such a pane it lands in the pane that currently carries the container's pointer.
   *
   * Give the tab a label, or several open items all read as the child surface's own title.
   */
  open(path: string, label?: ContainerTabLabel): void;
}

/** How an opened child's tab is labelled — the same fields a content tab carries. */
export interface ContainerTabLabel {
  /** Transloco key, or a literal when {@link titleIsLiteral} is set. */
  readonly title?: string;
  readonly titleIsLiteral?: boolean;
  readonly icon?: string;
}

/** DI token for the {@link ContainerHandle}; `null` outside a container. */
export const CONTAINER_HANDLE = new InjectionToken<ContainerHandle | null>(
  'lw.container-handle',
  { factory: () => null },
);
