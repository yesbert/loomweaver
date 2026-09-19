> **Status:** approved.

## Why

A list that lives in the main area cannot open its items beside itself. Clicking into the list
focuses its pane, the pane carrying the address follows the focus, and every item the list then
opens lands in that same pane and covers the list. The arrangement a list invites (browse on one
side, read on the other, one reused preview for reading) can only be built by the person dragging
each item across by hand, and the next item covers the list again.

NextPA reported this as finding F-030 from a knowledge-base listing that has to stay in the main
area because it is a wide grid. The platform has no way to express "open this next to where the
person is working", although the editor this behaviour was modelled on has it as "open to the side".

## What Changes

- Opening content SHALL accept a request to open it **beside** the pane carrying the address. The
  item then opens in the neighbouring pane, the one that would take the address pane's place if it
  were closed. Where the main area is not split, a pane is split off to the right for it.
- Opened beside, an item shown as a preview SHALL take the neighbouring pane's own preview slot, so
  browsing through a list reuses one tab beside the list.
- Opening beside SHALL leave the address where it is: the pane the person is working in keeps it,
  and with it the ability to open the next item beside again.
- Content already open is not opened a second time; where it is open in the neighbouring pane, that
  pane shows it.
- Where the distribution has switched splitting to the right off, opening beside uses an existing
  neighbour but does not create one; without a neighbour it opens as an ordinary open would.
- The request is available to a plugin on both runtimes, in-process and sandboxed, and to the
  distribution through its tab service, because both reach the same opening.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-tabs`: a new requirement *Content can open beside the pane carrying the address*, and
  *One preview slot per pane, promoted only on purpose* says that an item opened beside fills the
  neighbour's slot rather than the address pane's. The latter is written against the text of
  *a-preview-moved-to-another-pane-is-kept*, which has to be archived first.

## Impact

- `platform/libs/core/plugin-sdk/src/lib/content-route.ts`: `OpenTabInput` gains an optional
  `beside` flag with its JSDoc; the JSDoc of the interface stops saying every open navigates.
- `platform/libs/core/shell/src/lib/regions/content/tabs/content-tabs.service.ts`: opening beside
  resolves the neighbouring pane, splits where allowed and needed, fills that pane's preview slot and
  leaves the address alone.
- `platform/libs/core/shell/src/lib/regions/pane/tree/`: the neighbour of the address pane is the
  leaf the tree already promotes when that pane is closed; the tree query is reused, not duplicated.
- `platform/libs/core/shell/src/lib/plugin/sandbox/sandbox-rpc-sanitize.ts`: the flag crosses the
  sandbox boundary.
- `llms-full.txt`, `docs/weaver/content-area.md` and `docs/distribution-api/tabs.md`.
- NextPA finding **F-030**, second half. NextPA's own fix direction (fill the slot where the last
  preview lives) is not taken; the design note says why.
- No breaking change: the flag is optional, and without it every open behaves as before.
