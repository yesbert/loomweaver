## Context

`popout-view.html` holds one `lw-surface-body`. The component that draws actions,
`lw-surface-actions`, takes a pane path and a region and is used by the panel header, the tab strip
and the floating pane controls. `CommandService.available` already knows whether the window is a
pop-out and whether a command declares `popout`; `CommandService.triggerable`, which the actions use
today, asks only whether the command is registered.

## Goals / Non-Goals

**Goals:** the same component, in a fourth place, with the pop-out's command rule applied.

**Non-Goals:**

- Pane controls in a pop-out. There is no pane.
- A title bar. The browser window carries the product's name already.
- Actions for sandboxed surfaces.

## Decisions

**A bar above the body, drawn only when it holds a button.** The component already renders nothing
without actions; the pop-out wraps it in a row that is shown by the same has-a-button rule the
floating controls use. A floating group over the surface was considered and rejected: in a pane it
sits where the pane controls sit, and a pop-out has none, so it would cover content for no reason.

**Availability, not registration, decides in a pop-out.** For an action that names a command, the
component asks whether the command is available in this window. In the main window that changes
nothing the access gating does not already do. An action with inline behaviour stays, because
nothing declares where it belongs; the guide tells authors to back an action with a command when it
should stay out of a pop-out.

**The region handed to a menu context is the pop-out's own**, so a menu entry can tell where it was
opened.

## Risks / Trade-offs

- [The pop-out is no longer strictly bare] → that is the decision the proposal puts to the owner.
- [An action whose inline behaviour reaches the main window's arrangement runs in a pop-out] → the
  same is true of any code the surface itself runs there; the guide names it.

## Open Questions

- Whether the bar should also carry the surface's title. Not needed for the actions, and the window
  title has the product's name; left out unless the pop-out reads as headless with it.
