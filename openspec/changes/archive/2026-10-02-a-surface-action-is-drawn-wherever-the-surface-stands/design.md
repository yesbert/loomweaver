## Context

`ViewAction` is part of every surface declaration, but only `shell-panel.html` drew it. Reading the
code for this change found why a content surface drew nothing. A routable surface is turned into a
content route and back on its way into the registry, and that round trip dropped `actions`. The tab
strip did carry a row for the active tab's actions, behind the pane's controls, but no caller ever
filled it, so it was dead. The content area has two headers, the address pane's and a secondary
pane's, both of which hand a toolbar template to the tab strip, and a floating toolbar where no
strip is drawn. The rail and the
bar already share `chrome-item-menu.ts` for "this item opens a menu on activation"; the panel's
action buttons have neither that nor the right-click the contract documents. `MenuService.open`
returns without opening for a slot that resolves to no entry.

## Goals / Non-Goals

**Goals:**

- One place draws an action, used by every header, so that a panel and a pane cannot differ.
- An action is a chrome item like a launcher entry where its menu is concerned.
- The owner of a slot needs no knowledge of who fills it.

**Non-Goals:**

- A plugin-side read of a slot's entries, or `hasMenuItems`. Rejected below.
- Actions on sandboxed surfaces. The sandbox seam carries no actions today; that is its own change.
- Overflow handling for many actions. A surface with more actions than fit names a menu.
- Placing a tab in a named pane (finding #44), which stays parked.

## Decisions

**The actions survive the route round trip.** The registry's own route shape carries `actions`, the
way it already carries the host-stamped plugin id. The published `ContentRoute` is not widened: a
plugin declares actions on the surface, not on a route.

**One `lw-surface-actions` component.** It takes the pane path of what is shown and the region it
stands in, resolves the surface, and renders the buttons with tooltip, pressed state, access gating
and the menu directive. The panel header, the tab strip and the floating controls all use it, and
the strip's dead row is removed. The alternative, filling the strip's row and keeping the panel's
own loop, is the twin written twice. It lives in the content slice, because the pane slice may not
depend on the session and the content slice already does.

**In a pane, the actions stand in the tab strip before the pane's controls, behind a divider.** The
strip is what the address pane and a secondary pane share. Where no strip is drawn the same
component stands with the floating controls, and that group is shown as soon as it holds any button.
Whether a pane draws them is a pane option: content panes and the panes inside a container do, a
panel's inner panes do not, because the panel's header already does.

**An action that names neither a command nor inline behaviour stays drawn.** The panel always drew
such an action, and tests pin it. Only the empty-menu rule hides an action.

**An action reuses `menuTrigger` and `menuHeader` and the existing helper.** `ChromeItemMenu` already
describes exactly the fields an action has. The menu context is
`{ targetKind: 'view-action', id, region, surface }`, so an entry knows which surface it was opened
against.

**The empty trigger is hidden by the workbench, reactively, rather than read by the plugin.** The
finding asks for a read "or a `hasMenuItems(slot)`" so the plugin can decide whether to draw the
trigger. But once the header draws the action, the plugin no longer draws it; the workbench does,
and it already knows the slot's entries and the session they are filtered by. A read would hand the
plugin other plugins' contributions for a decision it no longer has to make. The rule is applied to
every control that opens a menu on activation and names nothing else, because a rail entry that
silently does nothing is the same defect.

**"Offers an entry" means after the filters a menu applies when it opens**: the entry's command
exists and was not removed, its access is met, its label resolves. A slot whose entries are all
disabled still counts, since a disabled entry is drawn.

## Risks / Trade-offs

- [A distribution relies on an always-present launcher entry with an empty menu] → it was inert; its
  absence is named as a behaviour change in the release notes.
- [Many actions crowd a narrow pane's header] → they share the toolbar's existing behaviour in a
  narrow strip; the guide says to prefer one menu-opening action over a row of them.
- [An entry's visibility depends on a menu context only known at open time] → the emptiness check
  uses the same context the control would open with, which is fixed per control.
- [A surface docked in a panel and also opened in a pane shows its actions twice] → that is two
  instances in two headers, each acting on its own.
- [A pop-out window was not exercised] → the spec limits the guarantee to the main window; the
  pop-out is a follow-up to look at, not a claim.
