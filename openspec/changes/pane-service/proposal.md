> **Status:** proposed — not approved for implementation yet.

## Why

A distribution can drive the content area's **tabs** from its own code today, through the published
tabs service, and since the switches went live it can hide any pane control and keep the capability.
What it cannot do is the **arrangement**: split a pane, close one, blow one up, collapse one, move
the address to another, carry a tab across. That behaviour exists, but it lives in the components
that draw the controls and in the seeded command, with internal arguments (`dock`, `paneId`) and in
two copies: the pane view and the content area each split, close, maximise and minimise on their own,
and the split command decides between splitting and unsplitting by itself.

So a product that switches the pane toolbar off has nothing to wire its own toolbar to. And the
behaviour it would want is the one thing the rules say must not be copied: the twin has to be the
same code the control runs.

This is the second slice of the distribution-facing workbench API. It gives the arrangement side of
the content area one service, moves the behaviour out of the triggers into it, and lets the
distribution read the arrangement as facts and address a pane through a handle the workbench hands
out.

## What Changes

- **A published pane service.** The content area's arrangement is reachable from a distribution's own
  code: split the pane that is showing something to the right or downwards, duplicating what it shows
  the way the toolbar does; close a pane; undo the split; blow a pane up, collapse it and restore it;
  move the address to a pane; move a tab into a pane. Arguments are the user's: an optional pane
  handle, and without one the pane that carries the address is meant.
- **Panes are addressed by handles.** The workbench hands out an opaque handle per pane. A handle is
  stable for as long as the pane exists and names nothing afterwards: an action with a stale handle
  does nothing. The distribution never sees pane ids, docks or the tree.
- **The arrangement is readable as facts.** Which panes there are and what each shows, which one
  carries the address, whether the area is split, which pane fills the area, which are collapsed;
  all as reactive values, so a distribution's own controls follow them.
- **The behaviour moves into the service and the controls call it.** Splitting with the check that
  what is shown can be duplicated, closing a pane with the unsaved-work guard and the choice between
  collapsing the address pane and removing a sibling, blowing up, collapsing, focusing. The pane
  view, the content area and the seeded split command stop carrying their own versions. The split
  command keeps its toggle (split, or undo the split) and nothing else.
- **The guards travel.** Closing a pane through the service asks about unsaved work exactly as the
  close control does. Undoing a split that would drop work asks the same question.
- **The switches do not reach the service.** A distribution that switched `splitRight` off can still
  split through the service, as `host-services` requires; the switch removed the user's control.
- The content-area tabs service is not touched. Content stays one service, arrangement becomes
  another, with a stated boundary between them.

No breaking change: every existing control keeps working, and no published name changes meaning.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `panes`: adds that the arrangement of the content area is reachable to the distribution through
  the same actions the controls perform, that a pane is addressed by a handle the workbench hands out
  and that a stale handle names nothing, and that the arrangement is readable as facts. The scope of
  this reach is the content area; sidebar panes are not addressed here.
`host-services` is not modified: its requirements already cover the service this change adds (the
same code as the controls, facts as reactive state, reachable while switched off), and the tests
this change adds pin them for the pane service.

## Impact

**Shell, pane slice.** A new service in `regions/pane/` owns the arrangement actions of the content
dock. The pane view and the content area lose their own split, close, maximise, minimise and focus
logic and call the service; the seeded `shell.content.splitRight` command keeps only its toggle; the
duplicate-check `offRouterMountable` is called from one place. The pane tree service, the chrome
service and the move service stay internal and unchanged; the new service is the published face over
them.

**Published contract.** `@loomweaver/shell` exports the service, the handle type and the fact type.
Every added name must appear in the consumer documentation before `check-api-docs` passes.

**Documentation.** `docs/reference/host-services.md` gains a *Panes* section; the boundary to the
tabs service is stated there.

**Specifications.** A delta on `panes`. `host-services` is unchanged.

**Legacy sources dissolved.** None. The exploration behind this slice is recorded privately; the
rules it follows are in `CONTRIBUTING.md`, section *Shaping the surface*.
