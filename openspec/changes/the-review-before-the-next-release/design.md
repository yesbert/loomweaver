## Context

The review produced findings of three kinds: confirmed by reading the full path, plausible, and
leads the reviewer could not verify before it stopped. None was run. A finding is therefore a claim
until a test shows it.

## Decisions

**Every task starts with the test.** The test is written first and has to fail for the reason the
finding gives. A finding whose test cannot be made to fail is struck from the list with the reason,
not fixed on suspicion. A lead is treated the same way.

**Order: what can hurt a user first.** The plugin trust boundary, then the paths that lose unsaved
work or stored state, then everything else. The guards and the release workflow come before the
hand-over, because the release runs through them.

**One pull request per group of the task list.** A group is one area and one reviewable diff. The
automated reviewer is out of quota, so each pull request gets an independent read of its diff before
it merges.

**Replacing is limited by where the plugin runs, not by how it arrived.** The alternative was to
limit it by installation, so that a frame plugin the distribution composes could still replace. A
frame plugin is somebody else's code whichever way it arrived, and the toolbar slot already refuses
on ownership alone. A distribution that wants to override does it in its own code.

**A move asks before it destroys unsaved work.** A tab that changes panes is built anew in its new
pane, as before, so every instance whose tab leaves its pane is asked about first, exactly as closing
that tab would ask, and a refusal leaves the tab where it was. Carrying the instance over instead
was built and taken out again, because it collides with two things the platform is built on: a
surface's instance id is its pane's key, which is what plugins key stored state by, and its injector
belongs to the pane's body.

**The bundle-size guard counts what the browser fetches.** It follows the static imports of the
entry script, so the recorded ceilings rise once to the real number. That is a correction of the
measurement, not growth, and the pull request says both numbers.

## Risks

- A fix in the pane tree or the address handling changes a path the end-to-end suite exercises and
  the merge gate does not. The suite is run on `main` after the groups that touch panes, tabs and
  routing have merged, and before the hand-over.
- The release workflow cannot be exercised without publishing. Its changes are kept to a skip and a
  comparison, each tried with `--dry-run` or against an existing version.

## Open for the owner

On `main` a surface parked by one workspace is claimed by another workspace that shows the same
address in a pane of the same id, taking its unsaved edits along. Separating them per workspace was
built and taken out again, because it raised questions only the owner can settle: which workspace
owns a surface that stays on screen across a switch, what happens to in-use surfaces when the active
workspace is deleted, and when an arrangement counts as arrived while the address is still settling.

Carrying a surface to another pane instead of rebuilding it, so that a drag keeps unsaved work
without a question, is open too. Two things would have to be decided first: what an instance id
means once an instance can move between panes, and where a moved surface's injector lives.

The workbench-capture capability says a plugin is given no moment at which it could act differently
because it is being pictured. A repaired end-to-end test shows that it is given one: the first
picture appends a script to the frame's document and a load event fires, and every picture adds and
removes an element there, so a mutation observer in the plugin's own script is called during each
picture. No message reaches the frame. The drawing works by copying the frame's page inside the
frame, so closing this means drawing a surface another way, or saying in the capability what a
plugin can notice. The test is kept as a skipped test that states the guarantee.
