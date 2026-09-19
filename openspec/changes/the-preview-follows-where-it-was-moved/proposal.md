> **Status:** approved.

## Why

A list in the main area cannot browse its items beside itself. The user drags the italic preview
tab next to the list, and two things go wrong: the tab stops being a preview the moment it leaves
the pane carrying the address, and the next item opened as a preview does not go there anyway. It
opens as a new preview in the pane the user just clicked into, which is the list's own, and covers
the list.

What the user expects is that the preview is one thing that stays where they put it: dragged beside
the list it is still the preview, and every further item browsed from the list lands in it, with the
address following it as it did when it was dragged. NextPA reported this as finding F-030.

## What Changes

- The main area holds **one** preview, not one per pane. Opening content as a preview replaces that
  preview in place, in whichever pane it stands; that pane then carries the address, which names the
  new content. Without a preview anywhere in the main area, the new one opens in the pane carrying the
  address, as today.
- A preview moved to another pane of the main area — by dragging, by its menu or by the keyboard —
  **stays a preview**. Today it is promoted when it leaves the pane carrying the address.
- A preview moved into a sidebar becomes permanent, as it does today; a sidebar holds no preview.
- The brief, the published type's documentation and the weaver guide say this, and stop saying
  "per pane" or "of the URL strip".

No new call, option or menu entry: `openContentTab({ preview: true })` keeps its signature and
changes where it lands.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-tabs`: *One preview slot per pane, promoted only on purpose* becomes *One preview in the
  main area, wherever it was moved, promoted only on purpose*: one preview for the main area, opening
  replaces it where it stands and hands that pane the address, and a move within the main area keeps
  it a preview.

## Impact

- `platform/libs/core/shell/src/lib/regions/pane/drag/pane-move.service.ts`: a moved preview keeps
  its state while it stays in the main area and loses it only when it leaves it.
- `platform/libs/core/shell/src/lib/regions/content/tabs/content-tabs.service.ts`: opening a preview
  finds the one preview in the main area; where it stands in another pane than the one carrying the
  address, it is replaced there and that pane takes the address.
- `platform/libs/core/plugin-sdk/src/lib/content-route.ts` (JSDoc of `OpenTabInput.preview`),
  `platform/libs/core/shell/src/lib/foundation/shell-features.ts` (JSDoc of `preview`),
  `llms-full.txt`, `docs/weaver/content-area.md`, `docs/distribution/switching-capabilities-off.md`.
- `platform/apps/loom-testbed-e2e/src/`: an end-to-end test of the drag and the next preview.
- NextPA finding **F-030**. It supersedes the closed pull request #440, which built a different
  behaviour.
- Behaviour change without an API change: a distribution whose users split the main area sees a
  preview in a second pane stay a preview, and the next preview land there rather than in the pane
  they last focused. That is the point of the change; nothing that could be done before stops working.
