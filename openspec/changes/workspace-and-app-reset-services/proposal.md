> **Status:** proposed — not approved for implementation yet.

## Why

Workspaces are the one part of the workbench a distribution can declare but not drive. It composes
them with `provideWorkspaces`, and from then on the only ways to switch, save, reset, rename or
remove one are the workspace dialog and the rail: the service behind them is internal, and the two
reset commands carry the guard against losing unsaved work themselves. A product that hides the
workspace dialog, or that wants an administrator to reset every workspace from its own page, has
nothing to call; and if the service were simply exported today, a reset from code would skip the
question the command asks.

The application reset has the same shape: a service that resets the frame, a command that asks
about unsaved work before calling it, and no way for a distribution to do the same from its own
code without repeating the question.

This is the third slice of the distribution-facing workbench API. It publishes the two services,
moves the guards into them so the programmatic path is the same action as the control, and leaves
the "really?" confirmations where they belong: with the controls that ask them.

## What Changes

- **The workspace service is published.** A distribution reads the workspaces, the active one and
  which ones carry unapplied changes as facts, and switches, saves, applies a baseline, resets,
  renames and removes workspaces from its own code.
- **The application reset is published.** A distribution resets the application's own arrangement
  from its own code, and may ask for every workspace to be reset with it by calling the two
  services in turn.
- **The unsaved-work guard moves into the services.** Resetting the active workspace, resetting
  every workspace, resetting the application and removing a workspace ask about unsaved work inside
  the service, so a distribution's call asks exactly what the built-in command asks. The commands
  stop carrying the guard and keep only their own confirmation dialogs. Removing a workspace gains a
  guard it did not have: it destroys the retained work parked under that workspace, and nothing asked
  before.
- **A guarded operation answers whether it ran.** Reset, reset-all, application reset and remove
  report whether the guard let them through, so a caller that chains them stops when the user
  declined.
- **Switching stays unguarded**, as the capability requires: a switch parks work and loses nothing.
- **Switched-off workspaces stay reachable.** With `workspaces.enabled` off the commands and rail
  entries are gone for the user; the service works for the distribution, as `host-services` requires.

No breaking change: no published name changes meaning, and the two commands behave as before for
the user, with the question asked once as it is today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspaces`: adds that workspaces and the application reset are reachable to the distribution
  through the same actions the controls perform, with the same guards; that a guarded action
  reports whether it ran; and that removing a workspace asks about unsaved work parked under it.

`host-services` is not modified; its requirements cover the two services this change publishes, and
the tests this change adds pin them.

## Impact

**Shell.** `WorkspaceService` (workspace slice) gains the guard in `reset`, `resetAll` and
`remove`, and the three become asynchronous and answer a boolean. `AppResetService` (layout slice)
gains the guard in `reset`, likewise. The retention stash exposes the parked instances of one
workspace, which `remove` needs for its candidates. `shell-seeds.ts` loses the guard from
`shell.workspace.reset` and `shell.app.reset` and calls the services in the right order. The
workspace dialog and the unusable-workspace notice, which run the commands, are unchanged.

**Published contract.** `@loomweaver/shell` exports `WorkspaceService` and `AppResetService`. The
`Workspace` record type they hand out is exported with them. Every added name must appear in the
consumer documentation before `check-api-docs` passes.

**Documentation.** `docs/reference/host-services.md` gains *Workspaces* and *Resetting the
application*. `docs/building-a-distribution.md`, where it describes the workspace dialog and the
app reset, points at the reference for the programmatic side.

**Specifications.** A delta on `workspaces`.

**Legacy sources dissolved.** None.
