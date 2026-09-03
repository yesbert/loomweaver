# Resetting the arrangement

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `workspaces` · `shell-layout`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The workspace reset takes the workspace it is given: the workspace dialog offers it on every row, so a
workspace can be put back without being entered first, and the reset acts on the active one where no
workspace is named. It puts back what belongs to that workspace, and nothing else. The
arrangement that lives beside every workspace — the activity bar the user curated, collapsed
sidebars, sidebar widths, hand sorting of tabs and rail entries, and named view instances with their
state — has its own reset, **`shell.app.reset`**. It sits in the palette and as a *Reset layout*
button under **General** in the settings dialog, and it asks first, naming what comes back and what
stays: colour scheme, language, text size, granted permissions and installed plugins are never
touched. Saved workspaces and their layouts stay as well, unless the user ticks the box that extends
the reset across every workspace. That box describes the one reset being asked for and is not
remembered as a setting. A surface with unsaved work is guarded exactly as it is on a workspace reset.

Driving the reset from your own code, with or without the workspaces and with the same unsaved-work
question, is `AppResetService` in the [host services](../distribution-api/reset.md).

Take it away like any other contribution: `omit: ['shell.app.reset']` drops the command, and with it
the settings button, because a button naming a command nobody registered is dropped rather than drawn
dead.

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../distribution-api/index.md): everything your own code can do once the product runs.
