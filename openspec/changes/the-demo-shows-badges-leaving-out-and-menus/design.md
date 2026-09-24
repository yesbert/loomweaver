## Context

See proposal.md for the motivation. The demo consumes the published 0.14.0 packages. The quotes
plugin (`demo/src/quotes`) is trusted and in-process: `quotesActions.open` opens a quote tab with
`openContentTab`, the list view draws a button per row, and the quote document is a container whose
`quotes.margin` child carries `access: { anyRole: ['accounting'] }`, so a sales account sees a
padlock there. The payments plugin (`demo/public/payments`) is sandboxed: `plugin.js` is the logic
frame holding the RPC `ctx`, `view.js` is the surface, which holds no `ctx` but has its own
`stateWatch` / `stateSet` channel. The view keeps its decisions in memory, so after a reload every
open item is open again. A trusted plugin's settings section owns its storage: the host only reads
`value()` and calls `set()`.

## Goals / Non-Goals

**Goals:**
- Each capability is visible in the running demo and pinned by an end-to-end test.
- The margin toggle and the padlock can be compared on the same child.

**Non-Goals:**
- Updating the badge of a quote tab that sits behind another. The agent's send command changes a
  draft to sent; the badge follows at once when that quote is in front, and when its tab sits behind
  another it follows the next time it is opened. Re-opening a tab is the only way to change its own
  badge and it brings the tab forward, so updating it in place needs a platform call that does not
  exist yet. That gap is held apart, as its own question for the platform.
- Keeping payment decisions across a reload. The count follows the view's decisions as they are.

## Decisions

**The quote badge rides on `openContentTab`, not on the surface.** Every quote tab shows the one
surface `quotes.document`, and each tab needs its own status, which is what a tab's own badge is
for. The text is the key the list's status filter already uses (`quotes.list.status.<status>`), the
tone mirrors the list's `STATUS_BADGE` (draft and expired neutral, sent brand, accepted success,
declined danger). A tab reopened from the list refines to the same badge. After the send command,
`quotesActions.refreshIfActive` re-opens the quote when it is the one in front.
*Alternative:* `updateSurfaceBadge` on `quotes.document` would give every quote tab the same badge.

**The margin toggle keeps its value in the plugin, persisted in local storage.** A trusted section
owns its storage, and the demo has no settings backend of its own. A signal holds the value, a
`localStorage` key keeps it across a reload, and an effect calls `ctx.setChildShown('quotes.margin',
value)` whenever it changes, including once at activation. Default on, so a first visit sees the
arrangement as declared.
*Alternative:* plugin state (`ctx.state`) is for working state, not settings, per the plugin-state
guide.

**The context menu lives in the list view, with its handler beside `preview` and `keep`.** The
row's button gets a `contextmenu` handler that prevents the browser's menu and calls
`ctx.ui.openMenu` at the pointer. "Open" keeps the tab, "Open as preview" previews it, "New quote
for this customer" calls `quotesActions.create` with the customer's name. The menu needs the `ui`
capability, which the quotes plugin already declares; `quotesActions` gains a small `openMenu`
passthrough so the view needs no `ctx` of its own.

**The payment count travels through plugin state, and the logic frame owns the badge.** Only the
logic frame holds the `ctx` that can call `updateSurfaceBadge`; the view knows the count. The view
watches and sets the key `openCount` whenever the items load or a decision changes; the logic frame
watches the same key and sets `{ text: String(count), textIsLiteral: true, tone: 'brand' }`, or
`null` at zero. At activation the logic frame clears the key and fetches the open items itself for
the first count, because the persisted value can be stale after a reload (the view's decisions do
not survive one) and the view may not be mounted yet. The badge is the bare number, as unread counts
usually are.
*Alternatives:* a fixed "Sandbox" badge shows much less; letting the view call the badge is not
possible, because a surface holds no `ctx`.

## Risks / Trade-offs

- [The bare number is announced as "Payment matching, 4"] → Short and common for counts; a worded
  badge would need the logic frame to know the host language, which it does not.
- [Bundle size] → The demo sits at 1351.7 kB of 1355. The quotes changes are small; a growth past
  the ceiling is raised deliberately and named.
- [A context-menu test is sensitive to where it clicks] → The test right-clicks the row's button by
  its accessible name, not by coordinates.
