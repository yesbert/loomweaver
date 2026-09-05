> **Status:** approved.

## Why

A sidebar insets whatever is docked in it, by three units, always. Nothing can ask it not to.

That fails a guarantee the platform already gives. The `surfaces` capability opens with *The
workbench SHALL apply no inset of its own*, and says of a surface's own declaration that it *SHALL
travel with the surface, so it holds wherever the user puts it, the content pane, a split, a
sidebar, a pop-out window*. The sidebar is named there, and it is the one mount point that ignores
both halves.

Measured in the demo, which asks for no inset at all: a view docked in the left sidebar starts
twelve pixels in. A view declaring `padded: false`, which is the contract's way of saying *I own my
edges*, starts twelve pixels in as well.

The content area has the mechanism and uses it. So does the pop-out window, which is drawn through
the same code. Only the panel hard-codes the inset into its template, which is why nothing reaches
it.

It surfaced while building a navigation tree for the demo's sidebar, where an inset the tree cannot
switch off is the difference between entries that line up with their headings and entries that do
not.

## What Changes

- A view docked in a sidebar is inset when, and only when, the composition asks for it or the view
  declares it, exactly as the same view would be in the content area.
- **BREAKING for anything already docked in a sidebar in a composition that asks for no inset**: the
  three units it was given for free are gone, and a view that wants them declares `padded: true` or
  draws its own. This is the behaviour the capability describes; what changes is that it now
  happens.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirement *A surface owns its edges unless something asks otherwise* under `surfaces`
already says what has to be true, in enough detail to name the sidebar. The implementation does not
do it there. Writing the requirement again would give us a second place to keep true, so this change
names the one it fails and brings a test that holds the sidebar to it.

## Impact

- `platform/libs/core/shell/src/lib/regions/panel/shell-panel.html` carries `p-3` on the container it
  mounts a view into, unconditionally. It is the whole defect.
- `platform/libs/core/shell/src/lib/regions/content/content-area.ts` and `content-secondary-pane.ts`
  already resolve the same question through `effectivePadding`. The panel joins them rather than
  growing a mechanism of its own.
- Every view the testbed and the demo dock in a sidebar loses an inset it did not ask for and has to
  draw its own where it wants one. In the demo that is the quote list, the open quotes and the agent
  chat; in the testbed the navigator, the notes and the rest.
- Any product already docking views in a sidebar is affected the same way, which is why the change
  says so plainly rather than treating it as a fix nobody notices.

No legacy source is dissolved by this change.
