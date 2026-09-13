## Context

See `proposal.md`, Why. What already stands, established by reading the code on 2026-09-13, and
NextPA's spike `spike/chat-picture-in-picture` (unmerged):

- **The retention stash owns every retained instance's nodes.** Releasing an instance, which
  collapsing a panel does, removes its live root nodes from wherever they are. Parking it, which a
  switch of view, tab or workspace does, sets its elements to `display: none` and, for a kept instance
  where atomic moves exist, moves its nodes into a hidden holding element in the body. Discarding and
  destroying remove the nodes as well.
- **The retained component repairs placement.** On every change of the stash's version it compares
  the root nodes' parent with its anchor and, when they differ, queues a repair that moves them back
  before the anchor.
- **A docked in-process surface already receives an instance-scoped handle**: the view mount service
  provides the view state per instance through the injector. A routable surface and an isolated
  surface receive none; the SDK documents both limits.
- **The spike** injects the chat component's host element, registers it with a float service, and a
  view action moves that element into a Document Picture-in-Picture window behind a placeholder
  comment, bringing it back on close. The distribution is not involved.

## Goals / Non-Goals

**Goals:**

- A surface can switch holding on and off for its own instance, from inside its component.
- While held, none of release, park, holding-area moves, repair or hidden-destruction touches it.
- Turning holding off converges on exactly the state the instance would be in had it never been held.

**Non-Goals:**

- Detecting moved nodes, offering a float gesture, managing windows, mirroring presentation.
- Routable and isolated surfaces.

## Decisions

**The switch is an instance-scoped handle injected beside the view state, not a `ctx` call.** The
component is the only party that knows its element is elsewhere, and it already holds the element.
A `ctx` method naming the surface would be ambiguous for a surface with several instances and would
have to be wired from the component to the plugin anyway. A handle provided per mounted instance
answers exactly one instance and needs no identity at all.
*Alternative considered:* a distribution service keyed by view id. The distribution does not know
the surface floats; in NextPA it is entirely the weaver's business.

**Its shape is a fact plus two commands.** A reactive `held` read and `hold()` / `release()`, matching
how the surface rules report state and keeping the commands idempotent. It is published from the
plugin SDK as an injection token with an interface, like the view state, so a weaver depends on the
contract only.
*Alternative considered:* `hold()` returning a disposable. It reads well for a scope but loses the
readable fact, and a float that ends from the window's own close event has no scope to dispose.

**The stash checks the flag at the three entry points and defers what it skipped.** Each entry keeps
the instance's logical state as the workbench sees it (in use or not, retained or not) and only
skips the DOM effect: no pull on release, no hide and no holding-area move on park, no destruction by
the sweep while held. Turning holding off re-applies the effect for the current logical state: an
instance in use is placed by the repair, which the stash triggers by bumping its version; one that
is not in use is parked or released as its last transition asked, and the sweep may then destroy it
by the ordinary rules.
*Alternative considered:* releasing the instance from the stash while held and re-adopting it
afterwards. It would duplicate ownership bookkeeping and make closing a held instance a special case.

**The retention collector checks it as well.** Found while proving the change in the running testbed: besides the stash's own sweep, the collector evicts a parked instance that is clean and not asked to be kept, whenever its tab is still open. That is destruction for being hidden, so it skips a held entry there, and the stash's parked list reports whether an entry is held. Its other eviction, for a tab that is no longer open, is closing and still applies to a held entry. On release the stash bumps its version, the collector runs again and the ordinary rule decides.

**The repair checks the flag too.** A held instance is never displaced from the component's point of
view; the check sits in the component's displaced test so both the immediate and the queued repair
honour it.

**Closing ignores the flag.** Discard and destroy remove the nodes wherever they are, exactly as now.
A product that floated a surface whose plugin is then turned off gets an empty window, which is what
turning the plugin off means.

**Only docked in-process surfaces receive it.** Injecting it from a routable or isolated surface
throws with the same kind of message the view state gives, so the limit is found at the first try.

## Risks / Trade-offs

- **A product that forgets to turn holding off leaves an instance that is never hidden or destroyed.**
  → It is the product's own instance and its own switch; the handle's documentation says to turn it
  off in the same place the node is brought back, including the window's own close.
- **A held instance survives what would otherwise have released it, so memory stays in use.** → That
  is the purpose; a surface that needs it is one that must keep running.
- **Deferred effects must match the last transition exactly.** → Covered by tests for each
  combination of hold, collapse, view switch and workspace switch before and after turning off.

## Migration Plan

None. The handle is new and unused until a surface injects it.
