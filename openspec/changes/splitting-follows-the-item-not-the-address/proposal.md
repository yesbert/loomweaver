> **Status:** approved.

## Why

Splitting a pane stopped working for most addresses, and the released 0.8.0 carries it.

The split controls are absent, and the published service does nothing, whenever the address has more
than one segment or the route declares a parameter. Measured against the testbed:

| Address | Split offered |
| --- | --- |
| `overview` | yes |
| `search` | yes |
| `dashboard/overview` | **no** |
| `entry/e-01` | **no** |

`dashboard/overview` declares no parameter. It fails on the slash alone.

The cause is a conflation of two questions in `a pane service for the content area`. Whether the item
a pane is showing can be duplicated into a sibling is not the same question as which routes a picker
may offer as targets for an empty pane. The second question rightly refuses an address that names one
particular item, because a menu entry cannot invent the parameter. The first question is about the
item already on screen, where the parameter is known. Both were answered by the same predicate.

This is a defect, not a change of intent. The `panes` capability already requires that the user be
able to split a pane along either axis, and that a distribution reach the same action from its own
code. The implementation stopped meeting that.

## What Changes

- The condition for duplicating into a sibling asks whether a route matches the item on screen and
  the signed-in user may see it. It no longer asks whether the address could be offered in a picker.
- The two questions become two named predicates rather than one, so a later reader cannot reuse the
  wrong one by accident.
- The `panes` capability gains one scenario pinning that the shape of an address does not decide
  whether it can be duplicated. The requirement it belongs to already says the user can split; the
  scenario says what "cannot be shown in a second pane" does *not* mean, because reading that phrase
  too widely is exactly what produced the defect.

No published name changes and nothing is removed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `panes`: one added scenario under *Splitting a pane makes a sibling*, fixing the meaning of content
  that cannot be duplicated. The existing requirements stand unaltered.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/drag/pane-drag.service.ts`: gains the predicate for
  duplicating, beside the one for hosting.
- `platform/libs/core/shell/src/lib/regions/pane/pane-actions.service.ts`: asks the new one.
- `platform/apps/loom-testbed-e2e`: sixteen tests currently fail and are the evidence. They need no
  change; they were written before the defect and are what should turn green again.
- **Released versions.** `0.8.0` carries the defect and sits on the npm dist-tag `latest`. Nothing
  can be withdrawn from npm, so the fix ships as `0.8.1`.
- **How it escaped.** The end-to-end suite is deliberately outside the merge gate and runs nightly.
  The last nightly that reported green ran on `fd727e959`, before the pane service landed; the run
  after it was cancelled. The suite has never reported on this code. That gap is named here because
  it is the reason a defect of this size travelled into a release, and it belongs in the tasks.
