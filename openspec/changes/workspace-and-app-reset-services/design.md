## Context

See proposal.md, *Why*. What shapes the approach:

- `WorkspaceService` already has the surface the distribution needs: `workspaces`, `activeId`,
  `hasChanges`, `changedIds` as signals; `switchTo`, `saveCurrent`, `saveBaseline`, `reset(id?)`,
  `resetAll`, `rename`, `remove`. It is not exported. `reset` and `resetAll` are synchronous and
  unguarded; the guard lives in `shell.workspace.reset`, which asks `closeGuard.confirmDiscard
  (retention.all())` only when the reset targets the active workspace, and never for a named one the
  user is not in.
- `AppResetService.reset()` resets the rail, the panels, the panel sizes, the user order and every
  view instance, synchronously and unguarded; `shell.app.reset` asks the same question once and then
  calls it and, if the dialog said so, `workspace.resetAll()`.
- `remove(id)` evicts the retained work parked under that workspace (`stash.evictWorkspace`), and
  the workspace dialog confirms the deletion but never asks about unsaved work in what is evicted.
- The capability says a switch never asks and never loses work; `switchTo` parks surfaces, so it
  stays unguarded.
- The slice graph: `workspace/` imports `layout/` (the layout token). `layout/` importing
  `workspace/` would create a new mutual pair, which the import-cycle ratchet forbids.

## Goals / Non-Goals

**Goals:**

- Publish `WorkspaceService` and `AppResetService` without a second, unguarded version of any
  destructive action existing anywhere.
- The guard lives in the service; the commands keep their confirmation dialogs and nothing else.
- The user experience of the two commands is unchanged: one question, asked once.

**Non-Goals:**

- No new facade. The services are published as they are, with their signatures adjusted where the
  guard makes an action asynchronous. Their arguments are already the user's (workspace ids the
  distribution declared or the facts hand out).
- No change to `switchTo`, `saveCurrent`, `saveBaseline`, `rename`.
- No change to the workspace dialog or the unusable-workspace notice beyond what follows from the
  service signatures; both run the commands.

## Decisions

**Guarded actions become `Promise<boolean>`.** `reset`, `resetAll`, `remove` and `AppResetService.
reset` ask the guard, which is asynchronous, and answer whether they ran. A caller that chains them
(the app reset command, a distribution's own "reset everything" button) stops on `false`. The
alternative, `void` with the guard inside, hides the outcome from exactly the caller that needs it.
`PaneService` uses callback-style guards and stays `void`; the difference is that nobody chains pane
actions on the guard's answer.

**`reset(id?)` asks only for the active workspace.** That is what the command does today and what
the capability's own reasoning says: elsewhere there is no live work. `resetAll` asks once with all
retained candidates and then resets each workspace without asking again, through a private path
the public `reset` shares.

**`remove(id)` asks for the parked work of that workspace.** The stash gains
`parkedInstancesOf(workspaceId)`, the instances it would destroy in `evictWorkspace`. `remove`
runs them through `confirmDiscard` first. This adds a question the dialog never asked; it is the
question `surface-retention` requires wherever work would be destroyed, and the removal confirmation
the dialog shows is a different question (a decision, not a rescue).

**The app reset stays in its slice and does not import workspaces.** `AppResetService.reset()`
guards with all retained candidates and resets the frame. Including the workspaces is done by the
caller in the order that asks once: first `workspace.resetAll()`, which asks and, if allowed,
re-applies every baseline (destroying the dirty surfaces it asked about), then `appReset.reset()`,
whose guard finds nothing dirty and asks nothing. The command does exactly this and stops if the
first answer was no. The alternative, a combined operation inside `AppResetService`, would import
the workspace slice from the layout slice and open a mutual pair the ratchet forbids; a shared
"reset everything" helper elsewhere would be a third door.

**The commands keep their dialogs.** `shell.workspace.reset` still asks "really reset?" (for both the
active and a named workspace) and then calls `reset(named?)`; the unsaved-work question comes from
the service when the target is active. `shell.app.reset` still opens its dialog with the
"include workspaces" choice and then makes the two calls. Nothing about the user's experience
changes: one confirmation, then at most one unsaved-work question.

**Facts stay as they are.** `workspaces`, `activeId`, `hasChanges` and `changedIds` are already
signals with the right names. The `Workspace` record type becomes part of the published contract
with the service; nothing else about it changes.

**No switch is read.** The service never consults `workspaces.enabled`; the seeds and the rail
entries do, which they already do reactively.

## Risks / Trade-offs

- [A caller ignores the boolean and chains anyway] → The second action guards itself; the worst
  case is a second question, never a silent loss.
- [Making `reset` asynchronous changes callers] → The only callers are the two commands and the
  dialog, which run the commands. Tests that call `reset()` synchronously await it.
- [`remove` now asks where it never did] → Only when a parked surface is dirty, which is exactly
  when silent eviction lost work before.
- [The two-call order for "reset everything" is subtle] → It is stated in the reference next to the
  code sample, and the command is the worked example.
