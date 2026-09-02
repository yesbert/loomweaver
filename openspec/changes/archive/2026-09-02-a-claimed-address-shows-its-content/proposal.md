> **Status:** approved.

## Why

`workspaces` already requires that opening the application at an address a declared workspace claims
activates that workspace **and shows the content within it**. The second half is not met when the
surface at that address asks to be retained.

Opening the testbed directly at the claimed sandbox address puts the tab in place, marks it selected,
and reports the surface as the active content. The pane is blank. The surface is in the document, but
its container carries `display: none` and hangs off `body` rather than off the content area: it never
left the stash that holds retained surfaces while they are hidden. Reaching the same address from
inside the application mounts it correctly, so the defect is specific to arriving at the address
rather than navigating to it.

What makes this worth its own change rather than a footnote is who meets it. It is the first thing a
person sees when they follow a shared link into content a workspace owns, and what they see is an
application that looks like it loaded and then failed to draw. There is nothing to click, and no
error says why.

Two end-to-end tests already fail on exactly this. They were left red by
`the-suite-follows-the-testbed`, which fixed the stale expectations around them and deliberately did
not touch these, so that the defect would not be papered over.

## What Changes

- A surface that declares retention and sits at an address a workspace claims is shown when the
  application is opened at that address, the same as one reached by navigating. This is the existing
  guarantee being met, not a new one.
- The two tests left failing are the regression tests. They are not rewritten; they pass when the
  defect is fixed.
- A test pins the arrival path itself, so that a retained surface reached cold is covered rather than
  only a retained surface reached warm.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The behaviour is already required by `workspaces`, under *A workspace may claim the content
that belongs to it*, scenario *Following a link into claimed content lands in its workspace*: the
claiming workspace becomes active **and the content is shown within it**. This change makes the
implementation meet it, so it declares `skip_specs: true`.

## Impact

The workbench's retention stash and the path that lays out an adopted workspace, in
`platform/libs/core/shell/`. Which of the two is at fault is for the design to establish; the symptom
is a surface left parked while the workspace it belongs to is laid out around it.

The regression tests already exist:

- `sandbox.spec.ts` — deep-links straight into a sub-route of the async-registered frame plugin
- `surface-retention.spec.ts` — the retained surface keeps its state across its own sub-routes

Both live under `platform/apps/loom-testbed-e2e/src/`.

One adjacent question comes with this and should be settled here rather than left loose: the testbed's
sandbox surface declares both `retain: 'always'` and `subRoutes`, and the workbench warns on every
boot that the two do not combine, because a retained surface mounts outside the router. One of the two
failing tests pins sub-route navigation inside that surface. Either the warning is right and the test
pins something unsupported, or the combination works and the warning is stale. The design decides
which, because the answer shapes what the fix may assume.
