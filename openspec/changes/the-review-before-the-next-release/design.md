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

**The unsaved-work question follows the work, not the active workspace.** The capability said a
reset of a workspace the user is not in asks nothing, because no live work is in it. Work parked
under it is live, and the reset destroys it, so the reset asks for exactly that work. Removing the
workspace in use asks once for what it shows and what it parked.

**The bundle-size guard counts what the browser fetches.** It follows the static imports of the
entry script, so the recorded ceilings rise once to the real number. That is a correction of the
measurement, not growth, and the pull request says both numbers.

**A change made before the store answered follows the shape of what is stored.** A view's state is
one value, which a surface often writes at start-up before it has read, so a stored value wins over
an early write; the early write is held like any other and only goes out if the store has not
answered by then. Sidebar state, widths and the user's order are records of independent keys, so an
early change is replayed on top of what the store held. Such a record is not written before the
store answered the read, because writing it unread would drop every other key, which means a change
made before a store that never answers is not stored.

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

**A bar entry that shortens itself is measured at its shortened width.** An entry that shortens
itself, the brand, is measured at the width it was shortened to, so the bar cuts the product's name
before it folds a button. Shell-layout's folding requirement, read literally, asks for folding
first, so that every entry left in the bar is shown at its natural width. Measuring at the natural
width would fold buttons where the name is cut today, and could fold the brand itself as the last
entry.

**Two colours sit under 3:1 on an overlay surface, and both are the brand's to decide.** Measured
as sRGB relative luminance, the way the website's contrast check does it. In the light theme the
brand blue `#2e96c9` reads 3.15:1 on the base surface, 3.32:1 on the raised surface and 2.95:1 on
the overlay surface `#eef2f6`. It shows wherever the blue is drawn as a mark over an overlay: every
focus ring, including the one inside a segmented control, whose own background is the overlay, and
a brand-coloured icon whose button takes the overlay on hover, such as the update badge. In the dark
theme the danger fill `#c62d2d` reads 3.21:1 on the base surface, 2.91:1 on the raised surface and
2.57:1 on the overlay surface `#232c36`. It shows as the danger button over a dark overlay, where
the button's edge is weak; its white label is unaffected at 5.51:1. Neither was changed here. Fixing
the first changes the brand's own blue, or gives focus rings a tone other than the brand; fixing the
second changes how the danger button looks in the dark theme. Both are a judgement about the
product's appearance rather than a correction. Three more numbers belong to the same
decision. The focus ring this change gave the segmented control and the track of a switch that is on
are that same brand blue on the overlay surface, 2.95:1 in the light theme. The light `caution`
`#b27f1e` drawn as an icon on its own 10% tint reads 2.84:1 where that tint lies on the overlay
surface. And after the user has consented, an update whose activation then fails still reloads,
which now costs the work the user agreed to discard for an update that did not apply.
