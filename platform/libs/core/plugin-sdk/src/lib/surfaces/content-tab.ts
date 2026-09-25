/**
 * A change to the label of an open content tab, made with `ctx.updateContentTab`. Every field is
 * optional: a field left out keeps the tab's value, and `badge: null` takes the tab's own badge away.
 * A title given here becomes the tab's own, as one it was opened with does.
 */
export interface ContentTabLabel {
  /** Transloco key, or a literal when {@link titleIsLiteral} is set. */
  readonly title?: string;
  /** Whether {@link title} is shown as it is rather than translated. Ignored without a title. */
  readonly titleIsLiteral?: boolean;
  /** Icon name for the tab. */
  readonly icon?: string;
  /** The tab's own badge, or `null` to take it away. */
  readonly badge?: TabBadge | null;
}

/** Input to `ctx.openContentTab` — opens a titled **dynamic** tab and navigates to it. */
export interface OpenTabInput {
  /** Concrete path to navigate to, e.g. `'doc/abc'` (not a pattern). */
  readonly path: string;
  /** Human title for the tab (e.g. the document name) — dynamic, not known from the URL. */
  readonly title: string;
  /** Icon name for the tab. */
  readonly icon?: string;
  /**
   * Whether {@link title} is a **literal** (shown verbatim) rather than a Transloco key. Default
   * `false` (the host translates it, preserving key-titled dynamic tabs). Set `true` for an inherently
   * dynamic title — a document name, an entity label — so the host skips the i18n lookup and does not
   * log a benign "missing translation" dev warning.
   */
  readonly titleIsLiteral?: boolean;
  /**
   * Runs once when **this** tab is closed (the host's close control, or `ctx.closeContentTab`), giving
   * the plugin a hook to free per-tab state, cancel in-flight work or persist a draft. Not called when
   * the tab is merely deactivated (still open) or when the whole plugin deactivates. Re-opening the same
   * path replaces the handler with the latest one. A sandboxed plugin gets no callback; the host calls
   * the `contentTabClosed(path)` method it exposes on its channel instead.
   */
  readonly onClose?: () => void;
  /**
   * Opens this as the **preview tab**: the one reused, *italic* tab for transient browsing. A later
   * preview for a **different** path replaces its content, wherever the user has moved it, instead of
   * adding a tab; without a preview in the main area it opens in the pane that carries the address.
   * It becomes permanent when the user double-clicks it, when you call `ctx.keepContentTab(path)`, or
   * when it is moved into a sidebar. Opening the **same** path again does not promote it, so a view
   * that re-opens itself to refine its title stays a preview. Default `false`; ignored where the
   * distribution turned preview off.
   */
  readonly preview?: boolean;
  /**
   * A badge of this tab's own, drawn beside its title, such as "Draft" on one document among others.
   * It wins over the badge of the surface the tab shows, is refined by opening the same path again,
   * as the title is, and survives a restart with the tab. Opening again without one keeps it; `null`
   * takes it away, so the surface's badge shows again.
   */
  readonly badge?: TabBadge | null;
}

/** The tones a {@link TabBadge} may take: the ones the workbench's `.lw-badge` look has. */
export type TabBadgeTone = 'neutral' | 'brand' | 'success' | 'danger';

/**
 * A short mark the workbench draws beside a tab's title, such as "Beta" or "Developer": a text, an
 * icon or both, in one of the workbench's badge tones. Its text is part of the tab's accessible name
 * ("Settings, Developer"); the badge is not a control of its own. In a strip that shows icons only,
 * its text moves into the tab's tooltip. A badge with neither text nor icon is no badge.
 */
export interface TabBadge {
  /** Transloco key for the badge's text, or a literal when {@link textIsLiteral} is set. */
  readonly text?: string;
  /** Whether {@link text} is a literal rather than a Transloco key. Default `false`. */
  readonly textIsLiteral?: boolean;
  /** Icon name, resolved by the host icon registry (a plain string). */
  readonly icon?: string;
  /** The badge's tone. Default `'neutral'`. */
  readonly tone?: TabBadgeTone;
}
