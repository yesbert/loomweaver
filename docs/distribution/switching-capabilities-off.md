# Switching capabilities off

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `gesture-configuration`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Every capability the shell offers its users is on by default: the platform ships the full workbench,
and a product that would overwhelm its users switches parts off with **`provideShellFeatures`**.
Fields merge group by group, so name only what you turn off. The declaration is the starting value:
reading a switch and changing it while the application runs is `FeatureSwitches` in
[Switches](../distribution-api/switches.md).

A switch takes the **affordance and the gesture**. Turning `splitRight` off removes the toolbar
button, the left/right drop edges _and_ `mod+\`, so the capability cannot come back through a second
door.

## Every switch

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
    collapse: true,           // default: collapsing and expanding a sidebar
    resize: true,             // default: the splitter that changes a sidebar's width
    reorderViews: true,       // default: sorting views *within* one sidebar
    moveViews: true,          // default: menu entry + drag + Alt+Shift+Arrow to the other sidebar
    hideViews: true,          // default: the "Hide" menu entry
    curate: true,             // default: the checklist on the icon strip
    stackViews: true,         // default: menu entry + dropping a view on a sidebar edge
    acceptTabs: true,         // default: parking a foreign tab in a sidebar
    openViewInContent: true,  // default: the menu entry
    resetViewState: true,     // default: the menu entry
    instances: true,          // default: the named-instance switcher in the sidebar header
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
buttons and by the palette. `workspaces.enabled: false` leaves storage scoping untouched: the
active workspace still names the layout keys, and the user simply never meets the concept.

A rail or bar item that names a command **nobody registered** is dropped rather than drawn, the same
way an orphaned menu entry is: switching a capability off never leaves a dead button behind.

## Content tabs and the pane toolbar

**Preview tabs.** The content area supports preview tabs: a weaver opens with `preview: true` to
reuse a single italic slot. It is **on by default**; opt out for the whole distribution with
`provideShellFeatures({ content: { preview: false } })`, which makes every `openContentTab` a
permanent tab.

`content.escalate` is the double-click cycle on a tab (preview → keep → pin → unpin); its first step
is the one users arrive expecting, and a preview tab says so itself: its tooltip reads "double-click
to keep open". Switch it off with `provideShellFeatures({ content: { escalate: false } })` and the
tooltip drops that promise, so no hint advertises a gesture that does nothing. Every step of the
cycle stays reachable from the tab's context menu either way.

Every content pane, the address pane and secondary panes alike, shows the **same** inline toolbar:
New tab, Split right, Split down, Minimize, Maximize and Close. The switches `newTab`, `splitRight`,
`splitDown`, `minimize`, `maximize` and `close` each take one button away together with the gesture
behind it, and fields merge, so the others stay on. A pane that holds no tabs offers the same buttons on a
floating toolbar, under the same switches. What each button does for the user is in
[Panes](../distribution-api/panes.md#in-depth).

## Sorting and moving

Users can drag or keyboard-reorder the host chrome: content tabs, rail items and view tabs within
their own band, with the order persisted user-locally. Reordering uses `@angular/cdk/drag-drop` (a
`@loomweaver/shell` peer dependency) and is **on by default**; `content.reorderTabs`, `rail.reorder`
and `sidebar.reorderViews` switch it off per container.

Sorting and moving are separate on purpose. `reorderViews` and `rail.reorder` govern the order
**inside** one bar; carrying an item **to the other** bar is `moveViews` and `rail.moveItems`, and
that one switch covers the menu entry, the drag and `Alt+Shift+Arrow` together.

A **container** surface's nested pane tree inherits these switches like any other pane, so a product
that turns splitting off does not get it back inside a "workspace-in-a-tab".

## Gestures, not contributions

`provideShellFeatures` is the home for **gestures**. A _contribution_ (a command, a bar or rail item,
a settings row, a menu entry) is not a gesture and is removed with
[`provideShell({ omit })`](recomposing-chrome.md#recomposing-host-chrome) instead.

The retention default is a storage policy rather than a gesture, so it lives on
`provideShell({ retention })`: the default and what flipping it costs are in
[Surface retention](surface-retention.md#the-rule).

## Where next

- [Switches](../distribution-api/switches.md): `FeatureSwitches`, reading and changing a switch while the application runs.
- [Recomposing host chrome](recomposing-chrome.md): removing a contribution rather than a gesture, with `omit`.
- [Surface retention](surface-retention.md): the `retention` policy in full, and what it costs a retained surface.
