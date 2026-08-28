import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders,
} from '@angular/core';

/**
 * Gestures the content area offers on tabs and panes. Each field takes the **affordance and the
 * gesture**: switching one off removes the button, the drag target and the keyboard shortcut alike,
 * so a capability can never come back through a second door.
 */
export interface ContentFeatures {
  /** Closing a tab: the × affordance, the `Delete` key and the close entries of the tab menu. */
  readonly close: boolean;
  /** Pinning a tab: the menu entry, the pin affordance and the pin step of the double-click cycle. */
  readonly pin: boolean;
  /**
   * The double-click cycle on a tab (preview → keep → pin → unpin). The first step is the one users
   * arrive expecting, and a preview tab says so itself — its tooltip reads "double-click to keep
   * open", which is why the hint is drawn only while this is on. Switch it off and the tooltip drops
   * the promise; every step of the cycle stays reachable from the tab's context menu either way.
   */
  readonly escalate: boolean;
  /** Dragging a tab into another pane, and onto an empty pane. */
  readonly moveTabs: boolean;
  /** The single reused italic **preview** slot (VS-Code "Preview Editors"). With it off, `openContentTab({ preview: true })` opens a permanent tab. */
  readonly preview: boolean;
  /** The "+" button that opens the new-tab picker. */
  readonly newTab: boolean;
  /** Splitting a pane horizontally: the toolbar button, the left/right drop edges and `mod+\`. */
  readonly splitRight: boolean;
  /** Splitting a pane vertically: the toolbar button and the top/bottom drop edges. */
  readonly splitDown: boolean;
  /** Blowing a pane up to the whole content area. */
  readonly maximize: boolean;
  /** Collapsing a pane into the minimised strip. */
  readonly minimize: boolean;
  /** Reordering tabs within their band, by drag or `Alt+Arrow`. */
  readonly reorderTabs: boolean;
}

/** Gestures the side panels offer on their docked views. */
export interface SidebarFeatures {
  /** Collapsing and expanding a panel. The close button of the compact drawer is not affected. */
  readonly collapse: boolean;
  /** Dragging a panel wider or narrower. */
  readonly resize: boolean;
  /** Reordering view tabs **within** one panel, by drag or `Alt+Arrow`. */
  readonly reorderViews: boolean;
  /** Moving a view to the other sidebar: the menu entry, the drag and `Alt+Shift+Arrow`. */
  readonly moveViews: boolean;
  /** Hiding a view from this workspace (menu entry). */
  readonly hideViews: boolean;
  /** The checklist on the icon strip that says which views live here. */
  readonly curate: boolean;
  /** Stacking a second view below the first: the menu entry and the drop edges of a panel. */
  readonly stackViews: boolean;
  /** Parking a foreign tab in a sidebar, by dragging it onto the strip or a drop edge. */
  readonly acceptTabs: boolean;
  /** Opening a docked view in the content area (menu entry). */
  readonly openViewInContent: boolean;
  /** Resetting the stored state of a view (menu entry). */
  readonly resetViewState: boolean;
  /** The named-instance switcher in the panel header, where a surface declares `instanceable`. */
  readonly instances: boolean;
}

/** Gestures the rail offers on its items. */
export interface RailFeatures {
  /** Reordering rail items **within** their band, by drag or `Alt+Arrow`. */
  readonly reorder: boolean;
  /** Moving an item to the other rail: the menu entry, the drag and `Alt+Shift+Arrow`. */
  readonly moveItems: boolean;
  /** Hiding a rail item (menu entry). */
  readonly hideItems: boolean;
  /** The checklist on empty rail space that says which items live here. */
  readonly curate: boolean;
}

/** Whether named workspaces exist for this product at all. */
export interface WorkspaceFeatures {
  /**
   * The workspace machinery the shell offers on its own: the manage and reset commands and the
   * workspace entries in the rail. Switching it off leaves the storage scoping untouched — the
   * active workspace still names the layout keys, the user just never meets the concept.
   */
  readonly enabled: boolean;
  /**
   * Whether the user may put a workspace **they saved** in the rail. A saved workspace is never
   * there by itself — the user places it from *Customize activity bar* — and switching this off
   * withdraws that offer, so the rail holds what your product put there and nothing else. Their
   * placements are kept rather than erased, so switching it back on restores what each user had.
   *
   * Everything else about a saved workspace is untouched: saving, renaming, resetting and switching
   * all work, with the workspace dialog as the way to them. This says nothing about **whether** a
   * user may save workspaces, which is a different question and has no switch.
   */
  readonly savedInRail: boolean;
}

/** Whether a tab or a view may be torn off into a browser window of its own. */
export interface WindowFeatures {
  /** "Open in new window" on a tab and on a docked view. */
  readonly popout: boolean;
}

/** How commands reach the user beyond the buttons that name them. */
export interface CommandFeatures {
  /**
   * Keyboard shortcuts at all: the global listener that turns a chord into a command, and the
   * chord hints the shell prints beside menu entries, palette rows and bar buttons. With it off a
   * command is still reachable by its button and by the palette, and no hint promises a key that
   * does nothing.
   */
  readonly shortcuts: boolean;
  /** The "recently used" section at the top of the command palette (and the list behind it). */
  readonly recentlyUsed: boolean;
}

/**
 * Which shell capabilities a distribution offers its users. The platform ships the full workbench —
 * every capability here is on by default — and a product that would overwhelm its users switches
 * parts off.
 *
 * This is the home for **gestures**. A *contribution* (a command, a bar or rail item, a settings row,
 * a menu entry) is not a gesture and is removed with `provideShell({ omit })` instead. Where a
 * capability has both — a menu entry *and* a drag — the feature switch wins and takes the entry with
 * it, while `omit` stays the finer tool for "entry gone, gesture stays".
 */
export interface ShellFeatures {
  readonly content: ContentFeatures;
  readonly sidebar: SidebarFeatures;
  readonly rail: RailFeatures;
  readonly workspaces: WorkspaceFeatures;
  readonly windows: WindowFeatures;
  readonly commands: CommandFeatures;
}

/** The default workbench: every capability on. */
export const DEFAULT_SHELL_FEATURES: ShellFeatures = {
  content: {
    close: true,
    pin: true,
    escalate: true,
    moveTabs: true,
    preview: true,
    newTab: true,
    splitRight: true,
    splitDown: true,
    maximize: true,
    minimize: true,
    reorderTabs: true,
  },
  sidebar: {
    collapse: true,
    resize: true,
    reorderViews: true,
    moveViews: true,
    hideViews: true,
    curate: true,
    stackViews: true,
    acceptTabs: true,
    openViewInContent: true,
    resetViewState: true,
    instances: true,
  },
  rail: {
    reorder: true,
    moveItems: true,
    hideItems: true,
    curate: true,
  },
  workspaces: { enabled: true, savedInRail: true },
  windows: { popout: true },
  commands: { shortcuts: true, recentlyUsed: true },
};

export const SHELL_FEATURES = new InjectionToken<ShellFeatures>(
  'lw.shell-features',
  {
    providedIn: 'root',
    factory: () => DEFAULT_SHELL_FEATURES,
  },
);

/** A partial override: name only what you switch off, group by group. */
export type ShellFeaturesInput = {
  readonly [Group in keyof ShellFeatures]?: Partial<ShellFeatures[Group]>;
};

/**
 * Switches shell capabilities off for this distribution, e.g.
 * `provideShellFeatures({ content: { splitDown: false, maximize: false } })`. Omit for the full
 * workbench; fields merge group by group, so a partial override leaves the rest of that group alone.
 */
export function provideShellFeatures(
  features: ShellFeaturesInput,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: SHELL_FEATURES,
      useValue: {
        content: { ...DEFAULT_SHELL_FEATURES.content, ...features.content },
        sidebar: { ...DEFAULT_SHELL_FEATURES.sidebar, ...features.sidebar },
        rail: { ...DEFAULT_SHELL_FEATURES.rail, ...features.rail },
        workspaces: {
          ...DEFAULT_SHELL_FEATURES.workspaces,
          ...features.workspaces,
        },
        windows: { ...DEFAULT_SHELL_FEATURES.windows, ...features.windows },
        commands: { ...DEFAULT_SHELL_FEATURES.commands, ...features.commands },
      },
    },
  ]);
}
