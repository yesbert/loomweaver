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

**Unsaved work moves with its tab.** Where a tab changes panes the instance holding the work is
carried over rather than the user being asked. The specification already says the tab keeps its
work in the neighbour, and a question on every drag would teach people to dismiss it.

**The bundle-size guard counts what the browser fetches.** It follows the static imports of the
entry script, so the recorded ceilings rise once to the real number. That is a correction of the
measurement, not growth, and the pull request says both numbers.

## Risks

- A fix in the pane tree or the address handling changes a path the end-to-end suite exercises and
  the merge gate does not. The suite is run on `main` after the groups that touch panes, tabs and
  routing have merged, and before the hand-over.
- The release workflow cannot be exercised without publishing. Its changes are kept to a skip and a
  comparison, each tried with `--dry-run` or against an existing version.
