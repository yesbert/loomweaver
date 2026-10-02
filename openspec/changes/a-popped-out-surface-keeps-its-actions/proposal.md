> **Status:** proposed — not approved for implementation yet.

## Why

Since 0.15.0 a surface's actions are drawn in the header of whatever holds it, so a content surface
no longer builds a toolbar of its own. A pop-out window has no header: it draws the surface's body
and nothing else. A surface opened in a window of its own therefore loses its actions, and with them
whatever the plugin moved out of its own toolbar on the platform's advice. The guide says a surface
works in a pop-out exactly as in a pane; for its actions that is no longer true, and the capability
limits the guarantee to the main window because the case was never exercised.

## What Changes

- **A popped-out surface keeps its actions**, in a bar above the surface. The window stays bare
  where the surface has none to draw.
- **An action that names a command is drawn there only if the command declares itself suitable for a
  pop-out**, the rule every other trigger in a pop-out already follows. An action with inline
  behaviour is drawn.
- An action that opens a menu works there as in a pane.
- The guides say so, and the "main window" limit leaves the capability.

**Owner's decision before approval:** the pop-out capability says a pop-out shows one piece of work
*and nothing else*. This change reads a surface's own actions as part of that piece of work and
amends the requirement accordingly. The other reading keeps the window bare and states in the guide
that actions do not travel into a pop-out; then this change becomes a guide correction with no code.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surfaces`: *A surface's actions are drawn wherever the surface stands* covers a detached window
  and loses its main-window limit.
- `popout-windows`: *A pop-out shows one piece of work and nothing else* admits that work's own
  actions.

## Impact

- `platform/libs/core/shell/src/lib/popout/popout-view.html` and `.ts`: the actions above the body.
- `platform/libs/core/shell/src/lib/regions/content/actions/surface-actions.ts`: in a pop-out, an
  action is offered only if its command is available there.
- `platform/libs/weavers/testbed-weaver`: a surface action that is suitable for a pop-out, since the
  search surface's present actions name commands that are not and would all be filtered out.
- `platform/apps/loom-testbed-e2e`: a pop-out test for a surface with actions.
- `docs/weaver/content-area.md`, the pop-out section of the distribution guide, `llms-full.txt`.
- No change to the published types.
- No legacy source is dissolved.
