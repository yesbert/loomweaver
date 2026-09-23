## Context

The proposal gives the motivation (see proposal.md, Why). Here is how the defect happens.

Since "the address moves and nothing else does" (archived 2026-09-22), the address-driven pane draws
the addressed content from the tabs it holds. Before that change it drew the addressed content from
the router outlet, whatever tabs the arrangement held. So an arrangement without a tab for the
address used to be harmless, and now it is not.

On a cold start at `knowledge-base/tags`, with the session not yet known:

1. The router matches the access placeholder. The placeholder does not settle the workspace; only
   the gated route does. The address tab `knowledge-base/tags` opens in the workspace the application
   started in.
2. The session arrives. The content router reloads the same address. Now the gated route matches,
   the workspace settles, and the workspace that claims `knowledge-base` is entered. Entering it
   replaces the whole pane tree with the declared arrangement, whose only tab is `knowledge-base`.
3. The effect that gives the address its tab (`OpenTabsService`) tracks the address, the active
   route and whether the tree was hydrated once. The address string did not change and the tree was
   hydrated long ago, so the effect does not run again. The address tab is gone.
4. `AddressBody` finds no tab for the address's tab root in the leaf and falls back to the leaf's
   active tab, `knowledge-base`. The listing is drawn under the address of the tags.

The reproduction is a unit test (written for the analysis, then removed): `ContentRouter`,
`ContentTabsService`, `AddressBody`, `provideWorkspaces` with a workspace that claims `knowledge-base`
and declares the tab `{ path: 'knowledge-base', closable: false }`, five gated routes registered
before the router starts, an anonymous session, a boot at `/knowledge-base/tags`, then a sign-in.
Before the sign-in the pane holds `knowledge-base/tags`; afterwards it holds `knowledge-base` and
draws it. Every variant without a claiming workspace, with the session already known, or with the
routes registered after the first navigation passes on 0.13.0.

## Goals / Non-Goals

**Goals:**
- After any replacement of the whole arrangement, the addressed content has its tab in the
  address-driven pane, exactly as after a change of address.
- A regression test with the real router and a late session that fails on 0.13.0.

**Non-Goals:**
- Settling the workspace on the access placeholder already, so that the claiming workspace is
  active before the session is known. The claim is about content, and the placeholder shows an
  explanation, not the content. Whether an explanation should already move the user belongs to its
  own change if anyone asks for it. This fix does not depend on it.
- Route order. Angular's router takes the first match, so `knowledge-base/:entryId` registered
  before `knowledge-base/tags` wins at the router for `/knowledge-base/tags`. Nothing drawn depends
  on it, because the panes resolve content by the longest match. It stays as it is.

## Decisions

**Make a whole-tree replacement observable, and let the tab sync read it.** `PaneTreeService` gets a
counter signal, `replaced`, that `hydrate()` increments and that the first restore from storage
increments too. The `OpenTabsService` effect reads it in place of `hydrated()`, which it read only to
run once after that first restore.
When the tree is replaced, the effect runs again, finds the address unchanged, skips the
address-change branch and runs `syncActiveTab`, which puts the addressed tab into the arrangement now
on screen.

- It covers every path that replaces the tree: entering a workspace, a workspace reset and adopting
  a signed-in person's stored working state. All three can leave the address without its tab for the
  same reason.
- Tried during the analysis: the reproduction passes, and so do all 2037 shell tests.

*Alternatives considered:*
- **Re-sync in `WorkspaceService.enter` only.** Narrower, but the reset and the adoption have the
  same gap, and a second caller would need to know to do the same. Rejected.
- **Let `AddressBody` fall back to the address instead of the leaf's tab.** Draws the right content
  but leaves the arrangement without a tab for it, so the tab strip lies about what is shown.
  Rejected.
- **Reuse `hydrated()` as a counter.** It means "restored once" to its other readers. Changing its
  meaning would change theirs. Rejected in favour of a separate signal, which the tab sync reads
  instead, since the first restore is one more replacement.

## Risks / Trade-offs

- [The sync now also runs after a reset or an adoption, where it did not before] → That is the
  intended behaviour: the address names content, and the contract says the address decides. The full
  shell suite passing with the change is the evidence that nothing relied on the old gap.
- [A replacement could run the effect in a loop] → `syncActiveTab` updates the tabs, not the tree
  wholesale, so it does not increment the counter.
