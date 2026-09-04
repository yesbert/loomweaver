# Workspaces

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `workspaces` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Everything the workspace dialog and the rail do, from your own code, under the ids you declared or the facts hand you.

## Do it

```ts
const workspaces = inject(WorkspaceService);

await workspaces.switchTo('review');     // never asks, never loses work
await workspaces.saveCurrent('Mine');    // the current arrangement as a new workspace
await workspaces.saveBaseline();         // the current arrangement becomes the baseline
workspaces.rename(id, 'Reviews');
const reset = await workspaces.reset();          // active workspace; asks about unsaved work
await workspaces.reset('review');               // a workspace you are not in; asks nothing
const all = await workspaces.resetAll();        // asks once for all of them
const removed = await workspaces.remove(id);    // asks for the work parked under it
```

## Read it

```ts
workspaces.workspaces();          // Signal<readonly Workspace[]>: the saved workspaces
workspaces.activeId();            // Signal<string>
workspaces.hasChanges();          // the active workspace differs from its baseline
workspaces.changedIds();          // every workspace that differs from its baseline
```

`workspaces()` is the list the user saved; the declared ones come from `provideWorkspaces`. `activeId()` is the active one, `hasChanges()` whether it differs from its baseline, `changedIds()` every workspace that does.

## What asks about unsaved work

Resetting the active workspace, `resetAll()` and `remove()` ask the question the built-in commands ask, inside the service, and answer whether they ran. Resetting a workspace you are not in asks nothing, because no live work is in it. `switchTo` never asks and never loses work: it parks the work, as the capability requires. The "really reset?" confirmation the dialog shows is your control's decision, not the service's.

## Switched off

`workspaces.enabled` removes the manage and reset commands and the rail entries for the user; the service keeps working for you.

## In depth

**Answers.** Every asking action answers whether it ran, so a chain of them can stop when the user
declined. Which actions ask is listed under *What asks about unsaved work*.

## Where the story is told

- [Developer-defined workspaces](../distribution/workspaces.md#developer-defined-workspaces): `provideWorkspaces` and what it declares.
- [Resetting the application](reset.md): every workspace and the frame in one guarded call.
