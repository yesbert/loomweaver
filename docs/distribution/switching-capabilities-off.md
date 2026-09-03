# Switching capabilities off

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `gesture-configuration`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Every capability the shell offers its users is on by default: the platform ships the full workbench,
and a product that would overwhelm its users switches parts off with **`provideShellFeatures`**.
Fields merge group by group, so name only what you turn off.

The declaration is the **starting value**, not a constant. Inject `FeatureSwitches` to read the
current value of any switch as a signal and to change switches while the application runs, with the
same partial shape you declare with. The controls follow live, switching off never undoes what the
user built, and nothing about a switch is persisted by the shell. The reference has the details:
[Switches](../distribution-api/switches.md).

A switch takes the **affordance and the gesture**. Turning `splitRight` off removes the toolbar
button, the left/right drop edges *and* `mod+\`, so the capability cannot come back through a second
door.

Every capability is on by default. `content.escalate` is the double-click cycle on a tab
(preview → keep → pin → unpin); its first step is the one users arrive expecting, and a preview tab
says so itself — its tooltip reads "double-click to keep open". Switch it off with
`provideShellFeatures({ content: { escalate: false } })` and the tooltip drops that promise, so no
hint advertises a gesture that does nothing. Every step of the cycle stays reachable from the tab's
context menu either way.

```ts
// src/app/app.config.ts — in the providers array
import { provideShellFeatures } from '@loomweaver/shell';

provideShellFeatures({
  content: {
    close: true,        // default: the × affordance, Delete, and the menu's close entries
    pin: true,          // default: the menu entry and the pin step of the double-click cycle
    escalate: true,     // default: the double-click cycle preview → keep → pin → unpin
    moveTabs: true,     // default: dragging a tab into another pane, or onto an empty one
    preview: true,      // default: the single reused italic preview slot
    newTab: true,       // default: the "+" button and its picker
    splitRight: true,   // default: button + left/right drop edges + mod+\
    splitDown: true,    // default: button + top/bottom drop edges
    maximize: true,     // default
    minimize: true,     // default
    reorderTabs: true,  // default: drag or Alt+Arrow within a band
  },
  sidebar: {
    collapse: true,           // default: collapsing and expanding a panel
    resize: true,             // default: the splitter that changes a panel's width
    reorderViews: true,       // default: sorting views *within* one sidebar
    moveViews: true,          // default: menu entry + drag + Alt+Shift+Arrow to the other sidebar
    hideViews: true,          // default: the "Hide" menu entry
    curate: true,             // default: the checklist on the icon strip
    stackViews: true,         // default: menu entry + dropping a view on a sidebar edge
    acceptTabs: true,         // default: parking a foreign tab in a sidebar
    openViewInContent: true,  // default: the menu entry
    resetViewState: true,     // default: the menu entry
    instances: true,          // default: the named-instance switcher in the panel header
  },
  rail: {
    reorder: true,    // default: sorting items *within* one rail
    moveItems: true,  // default: menu entry + drag + Alt+Shift+Arrow to the other rail
    hideItems: true,  // default: the "Hide" menu entry
    curate: true,     // default: the checklist on empty rail space
  },
  workspaces: {
    enabled: true,      // default: the manage and reset commands, and workspace entries in the rail
    savedInRail: true,  // default: the user may put a workspace they saved in the rail
  },
  windows: {
    popout: true,     // default: "Open in new window" on a tab and on a docked view
  },
  commands: {
    shortcuts: true,     // default: keyboard chords, and the chord hints beside entries
    recentlyUsed: true,  // default: the palette's "Recently used" section
  },
}),
```

The groups are typed: `ContentFeatures`, `SidebarFeatures`, `RailFeatures`, `WorkspaceFeatures`,
`WindowFeatures` and `CommandFeatures` make up `ShellFeatures`, and `ShellFeaturesInput` is the
partial you pass.

`commands.shortcuts: false` takes the global key listener **and** every chord hint the shell prints,
so no menu entry or palette row advertises a key that does nothing. Commands stay reachable by their
buttons and by the palette. `workspaces.enabled: false` leaves storage scoping untouched — the
active workspace still names the layout keys, the user simply never meets the concept.

A rail or bar item that names a command **nobody registered** is dropped rather than drawn, the same
way an orphaned menu entry is: switching a capability off never leaves a dead button behind.

Sorting and moving are separate on purpose. `reorderViews` and `rail.reorder` govern the order
**inside** one bar; carrying an item **to the other** bar is `moveViews` and `rail.moveItems`, and
that one switch covers the menu entry, the drag and `Alt+Shift+Arrow` together.

A **container** surface's nested pane tree inherits these switches like any other pane, so a product
that turns splitting off does not get it back inside a "workspace-in-a-tab".

`provideShellFeatures` is the home for **gestures**. A *contribution* (a command, a bar or rail item,
a settings row, a menu entry) is not a gesture and is removed with
[`provideShell({ omit })`](recomposing-chrome.md#recomposing-host-chrome) instead.

The retention default is **not** a user-facing capability but a storage policy, so it lives on
`provideShell` (`RetentionDefault` is `'destroy' | 'retain'`):

```ts
// src/app/app.config.ts
provideShell({ retention: 'destroy' }), // default
```

Every content pane — the URL pane and secondary panes alike — shows the **same** inline toolbar via one
component: New Tab · Split right · Split down · **Minimize** · **Maximize** · Close. The two
split gestures have one consistent meaning everywhere. The **toolbar split duplicates** the active
tab into a new pane; the tab stays where it is. **Dragging a tab or its Split right/down menu moves
it**. The split buttons only appear when the active content can be duplicated. **Maximize**
fills the whole viewport over all chrome (header, sidebars, other panes); Escape or the button restores it.
**Minimize** collapses a pane in a split to a thin strip. The strip shows the active tab's icon and
name, plus a `+N` badge when the pane holds several tabs. Clicking the strip restores the pane.
Minimize and Close appear on both panes of a split. Closing the URL pane dissolves the split and the
neighbour takes over the URL. With a single pane only Maximize is shown, since there is nothing to
minimize into or close. Hide any affordance distribution-wide with
`provideShellFeatures({ content: { splitDown: false, maximize: false, minimize: false } })` (fields merge,
so the others stay on). A pane that holds no tabs stays strip-less and gets a floating toolbar
instead — it honours the same `toolbar` options — and a chromeless screen shows no strip at all,
however many tabs are parked behind it. Both regain the strip as soon as they hold a tab and the
chromeless screen is left; a tab the strip does not draw would be a tab nobody can reach again.

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../distribution-api/index.md): everything your own code can do once the product runs.
