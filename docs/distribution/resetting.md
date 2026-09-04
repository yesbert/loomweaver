# Resetting the arrangement

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `workspaces` · `shell-layout`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The workbench has two resets, and each puts back one part of the arrangement. **Reset workspace
layout** (`shell.workspace.reset`) discards a workspace's live arrangement and re-applies its
baseline. **Reset app layout** (`shell.app.reset`) puts back what lives beside every workspace: the
rail the user curated, collapsed sidebars, sidebar widths, the hand sorting of tabs and rail
entries, and named view instances with their state. Each asks before it runs, and a surface with
unsaved work is guarded on both.

## Resetting a workspace

**Reset workspace layout** discards the active workspace's live arrangement and re-applies its
baseline after a confirm. For the Default workspace that is the declared factory layout. It is
reachable from the palette, and also as a button in the workspaces dialog. Saved workspaces, theme,
language and named view instances are kept. This is core behaviour with no provider to wire. It rides
on the same [persistence stores](persistence.md) as the rest of the chrome.

The reset takes the workspace it is given: the workspace dialog offers it on every row, so a
workspace can be put back without being entered first, and the reset acts on the active one where no
workspace is named. It puts back what belongs to that workspace, and nothing else.

## Resetting the app layout

The arrangement that lives beside every workspace has its own reset, **`shell.app.reset`**. It sits in
the palette and as a _Reset app layout_ button under **General** in the settings dialog. It asks
first, naming what comes back and what stays: colour scheme, language, text size, granted permissions
and installed plugins are never touched. Saved workspaces and their layouts stay as well, unless the
user ticks the box that extends the reset across every workspace. That box describes the one reset
being asked for and is not remembered as a setting. A surface with unsaved work is guarded exactly as
it is on a workspace reset.

Driving the reset from your own code, with or without the workspaces and with the same unsaved-work
question, is `AppResetService` in the [host services](../distribution-api/reset.md).

Take it away like any other contribution: `omit: ['shell.app.reset']` drops the command, and with it
the settings button, because a button naming a command nobody registered is dropped rather than drawn
dead.

## Where next

- [Resetting the application](../distribution-api/reset.md): `AppResetService`, the same reset from your own code.
- [Workspaces a product ships](workspaces.md): the baseline a workspace reset returns to.
- [Retention and unsaved work](../concepts/retention-and-unsaved-work.md): the question every reset asks first.
