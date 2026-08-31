## Context

See proposal.md for why. What matters for the approach is where the claim is consulted today, and
where content actually enters a workspace.

The claim is enforced in one place: `settleWorkspace`, a `CanActivateFn` on the content route. It
runs on router activation, awaits `WorkspaceClaims.settle(path)` and lets the navigation through.

Content enters a workspace somewhere else entirely. A plugin calls `openContentTab` on its
`PluginContext`, which forwards to the shell's content-tabs service, which adds the tab to the
primary dock of whichever workspace is active at that moment. The demo's `quotes.open` command takes
that route, as does anything a plugin opens. Nothing on that path asks who claims the address.

So the two steps are not merely in the wrong order, they are in different subsystems that do not
know about each other. The tab is added by the tabs service; the workspace is switched later by a
router guard, if a navigation happens at all. That is why the tab is left behind.

A workspace's pane tree, including that stray tab, is then written to storage under the workspace
that was active. The corruption outlives the session.

## Goals / Non-Goals

**Goals:**

- One door. The claim is consulted at the point content enters a dock, so the ordering holds for
  every caller without each one having to remember it.
- The router guard keeps covering what never passes through the tabs service: the boot address, a
  typed or pasted address, browser history.
- A workspace's stored dock and its stored active tab describe what the user actually had.

**Non-Goals:**

- Migrating stored state in any broader sense. The repair below drops a tab a workspace does not
  claim and nothing else; it is not a schema migration and carries no version marker.
- Changing the published `PluginContext` surface. `openContentTab` stays a synchronous `void` call;
  a plugin does not learn that a workspace switch happened, and does not need to.
- Reworking how claims are matched. `claimFor` and its narrowness rules are not implicated: the
  claim resolved correctly in the reproduction, it was simply consulted too late.

## Decisions

### The claim is settled inside the content-tabs service, before the dock is touched

The tabs service is the single point every in-application route into content passes through:
`open`, `keep` and `navigate` all end there, whether the caller is a plugin, a command, the
assistant, or shell chrome. Settling there makes the ordering structural.

Alternatives considered:

- **Leave it in the guard and have every caller settle first.** Rejected. That is the rule the
  implementation already fails, restated as a convention for future callers to remember. A rule
  that has to be remembered at each of several call sites is the defect, not the fix for it.
- **Refuse, at persistence time, to write a tab whose address another workspace claims.** Rejected
  as the primary fix. It treats the symptom: the tab would still be opened into the wrong dock and
  shown there, and only the storage would stay clean. Worth keeping in mind as a cheap guard
  against a future regression, but it is not the ordering the capability asks for.
- **Move the claim out of the router guard entirely.** Rejected. Addresses that arrive from outside
  the application never reach the tabs service, and the guard is the only thing that covers them.
  Both stay, each covering what the other cannot see.

### The synchronous API stays synchronous, and the settle is awaited internally

`WorkspaceClaims.settle` is asynchronous because switching a workspace reads stored state.
`openContentTab` is a synchronous `void` method on the published contract and will remain one, so
the tabs service has to sequence the work itself: settle first, then add the tab, with the caller's
call returning immediately.

That introduces an interleaving that does not exist today. Two calls arriving in quick succession
must not add their tabs in the opposite order, and a tab must not be added to a dock the settle is
in the middle of replacing. The implementation therefore needs a single ordered path rather than two
independent promises, and a test that fires two opens at claimed addresses back to back.

### The claim is asked synchronously whether it would move anyone

Deferring every open behind an awaited settle would make an API that is synchronous today behave
asynchronously for every caller, including the many that open content no workspace claims. That is a
large ripple for a case that is rare.

The internal `WORKSPACE_CLAIMS` token therefore gains a synchronous question beside its asynchronous
`settle`: would a claim move the user for this address. Answering needs only what the workspace
service already holds in memory, so it costs nothing. Where the answer is no, the tab is added
exactly as it is today, on the same turn. Where it is yes, the open goes through the ordered path.

The token is internal. It is not exported from the shell's entry point, so widening it touches no
published contract and no consumer.

Ordering then has to hold across the two modes: once an open has been deferred, everything after it
queues behind it, whether or not it would settle on its own, and `keep` and `pin` queue too. The
demo's own `quotes.open` is the case that proves it, since it opens and then immediately keeps, and a
`keep` that overtook its own `open` would promote a tab that does not exist yet.

### The active tab follows the address, and is what gets stored

There are two notions of which tab is active and they are not kept in step. The router URL decides
what the user sees. The pane tree carries an `active` field, and that is what a switch restores
through `activeContentPath()`. Nothing writes the first into the second, so the tree keeps whatever
`active` it was declared with, which is why the stored dock reads `active=quotes/q-0005` while
`q-0007` is on screen.

The tree's `active` field becomes a follower: when the active content path changes and names a tab
in the primary dock, the tree records it. The URL stays the source of truth for what is displayed;
the tree records it so that a switch away and back can restore it.

Alternative considered: derive `activeContentPath()` from the URL at switch time instead of from the
tree. Rejected. At the moment of a switch the URL belongs to the workspace being left, so the target
workspace has nothing to derive from. The tree has to carry it.

### Repair goes through the door stored state already comes in by

`parse()` in the pane-tree storage is the single point where a stored dock becomes a live one, and
it already drops things: a record that will not normalize, a dock that is empty. That work is purely
structural, though. It asks whether the record is well-formed and knows nothing about what the
product declares, which is why a tab belonging to another workspace passes straight through it.

So the seam exists and gains a second kind of check rather than a new mechanism. Naming the two kinds
is the part worth writing down, because they differ in who can act on the result:

- **Structural.** Is this readable as an arrangement at all. Dropped silently: a malformed blob names
  nothing a developer could fix.
- **Contradictory.** Does this still agree with what the product declares now. Dropped and announced
  in development, because it is usually the product's own declaration having moved, and that is
  theirs to know about.

What is deliberately not built is a registry of cleanup rules. There is one rule today. A registry
with one entry claims a generality the code does not have, and the next case would still have to fit
a shape invented before anyone knew what it was.

Where the next case actually hooks in is the capability, not a framework. The requirement is phrased
around stored content that a current declaration places elsewhere, not around claims specifically, so
a second case — a tab whose plugin is no longer installed, a view id the product dropped — arrives as
another scenario under a requirement that already exists, and finds one function beside `parse()` to
extend. That costs nothing today and is the whole of the provision made for later.

The risk in phrasing it that way is real and worth naming: a requirement broader than the code is a
promise on cases nobody has built. It is therefore written at the width that is true today, about
content a declared workspace claims, and widening it later is additive rather than a correction.

### A stored dock that holds an address its workspace does not claim is repaired when it is loaded

The fix stops new damage. It does nothing for a workspace already carrying a stray tab, and every
visitor to the deployed demo who followed the assistant into a quote carries one. Left alone, they
would keep landing on a foreign address until they cleared site data, which is not something to ask
of a visitor.

Hydration therefore drops a tab whose address another workspace claims, and says so once in
development mode. The warning is not for the user, who can do nothing with it: it is for a product
that produces the state itself, which would otherwise see tabs quietly disappear and have nothing to
go on.

Alternative considered: repairing silently. Rejected because a disappearing tab with no explanation
is the kind of behaviour that costs someone an afternoon, and the development-mode console is where
this repository already puts that class of message.

## Risks / Trade-offs

- **A settle now runs on a path that was synchronous.** → The tabs service gains an ordered queue
  rather than firing promises, and a test opens two claimed addresses in succession to pin the
  order.
- **A plugin's `openContentTab` can now move the user to another workspace before its tab appears.**
  → That is what the capability requires, and the plugin already could not know which workspace it
  was in. Worth stating in the JSDoc on the published method, which is the one place a comment is
  allowed.
- **Two enforcement points, the guard and the tabs service, could drift.** → Both call the same
  `WorkspaceClaims.settle`; neither reimplements the matching. The risk is a third route into
  content appearing later and bypassing both, which the test for the tabs service will not catch.
- **The active-tab follower writes to storage more often than today.** → It writes when the active
  content changes, which is bounded by user navigation, not by rendering.

## Migration Plan

No deployment step. A user already carrying a corrupted dock is repaired by the hydration guard on
their next visit, without being asked and without losing anything they chose: the dropped tab is one
they never opened in that workspace. Rolling back reinstates the stray tab, since nothing is erased
from storage that was not going to be rewritten anyway.

## Open Questions

None. The one question this design carried, whether to repair storage already corrupted, was
answered by the owner: repair at hydration with a development-mode warning, recorded above.
