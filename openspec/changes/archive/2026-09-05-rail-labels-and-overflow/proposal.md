> **Status:** approved.

## Why

A rail entry says what it is only in a tooltip. The icon is the whole visible label, so an entry is
identifiable at a glance exactly as far as its icon is distinguishable, and in a rail of any size it
stops being so. The testbed carries fourteen entries and already has three pairs that cannot be told
apart: *Isolated* and *Sandbox (iframe)* share one cube, and *Containers*, *Arranged container* and
*Browse container* share three near-identical rectangles. Reaching the name costs a hover, which a
touch device does not have.

The workbench already guarantees that workspaces are "identifiable at a glance" and that a chrome
entry may be drawn as a picture of what it stands for. Both are answers to the same question, and
both stop at the icon. The plainest answer, showing the name, is the one the rail cannot give.

The second half of this change is older and simpler. Nothing says what a rail does when it holds
more entries than fit. Today they are cut off at the bottom edge and cannot be reached at all: the
fourteen entries of the testbed already fill a 900 pixel viewport, and a user who curates entries
into a rail, which the workbench invites, can silently lose the last of them. Labels make the
overflow arrive sooner, which is why the two travel together, but the defect exists without them.

## What Changes

- A rail may draw each entry's name under its icon. The rail widens to hold the name, the name wraps
  to at most two lines, and the tooltip is dropped for an entry whose name is on screen, because a
  tooltip repeating visible text is only interaction cost.
- Whether a rail is labelled is the user's choice, off to begin with, and it is made per rail: a
  frame with a rail on each side offers one switch per rail, each under that rail's own name. A side
  the distribution did not declare offers no switch, because a row that cannot work is not drawn.
- A rail's name says which side it is on only where there is a second rail to tell it apart from,
  and that one name is used wherever the workbench speaks of the rail, the announced region name
  included. Today the left rail is *Activity bar* and the right one *Right activity bar*, which is
  distinguishable and lopsided: the left is named for its content and the right for its position.
- The choice sits in the settings, directly under the text size, and survives a restart the way the
  other shell settings do.
- A rail whose entries do not fit scrolls. The band anchored to the bottom stays where it is and
  the entries above it scroll under it, so the way out of a workspace does not scroll away with the
  entry that led into it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shell-layout`: the requirement *Each kind of region has a fixed anatomy* fixes what a rail is
  made of and says nothing about what it does when what it holds does not fit, nor whether an entry
  may carry its name. Three requirements are added beside it: one for the name under the icon and
  the user's per-rail choice over it, one for the overflow, one for how a rail is named. Neither
  loosens the anatomy; all three say what the anatomy does at its limits. The naming one sits beside
  *Both sides are symmetric* rather than inside it, because that requirement governs panels too and
  only rails carry a name of their own today.

## Impact

- `platform/libs/core/shell/src/lib/regions/rail/shell-rail.html` and `shell-rail.ts` draw the rail
  at a fixed width with a tooltip per entry, and place the bottom band with `mt-auto` inside the
  same scroll-free column. Both the label and the overflow land here.
- `platform/libs/core/shell/src/lib/default-settings.ts` registers `shell.textSize`; the new rows
  belong beside it, and unlike their neighbours there is one per declared rail rather than one
  outright.
- `platform/libs/core/shell/src/lib/i18n/en.json` and `de.json` carry `rail.label` and
  `rail.labelRight`, which name the rail for assistive technology and can name the settings rows
  too. They gain a third, for a left rail that has a right one beside it.
- `platform/apps/loom-testbed/public/i18n/overrides/` rewords the rail to *Toolbar* to show that a
  product can replace a single shipped string. The demonstration stays and moves to a neighbouring
  key, so that the testbed shows the workbench's own word for the rail while still proving the
  point. Every end-to-end helper that addresses the rail by that name moves with it.
- A new user setting needs somewhere to live, which is `SETTINGS_STORE`, the same port the rest of
  the shell's settings use.
- `platform/apps/loom-testbed` is where both halves are exercised: it is the only distribution with
  a rail on each side, and the only one with enough entries to overflow.
- The exploratory branch `feature/spike-rail-labels` hung an optional `labels` flag on
  `LayoutRegion` to see the labelled rail at all. It is not part of this change and is dropped: the
  choice belongs to the user, and a distribution that does not want it removes the row, which the
  settings surface already allows.

No legacy source is dissolved by this change.
