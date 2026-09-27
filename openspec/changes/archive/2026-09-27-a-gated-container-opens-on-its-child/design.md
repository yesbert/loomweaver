## Context

See proposal.md, Why. This is how the defect happens, reproduced in the testbed and in a unit test.

A container keeps its inner arrangement as a dock of its own (`container@<path>`) inside the pane
state of the active workspace. `ContainerPaneHost` creates that dock once, in its constructor
(`ensureContainer`), and then runs two effects: `followUrl` opens the child the address names, and
`leadUrl` writes the focused child back into the address.

On a cold start at `gated/one/design`, in a distribution whose stores are scoped by an identity that
is known only when the session answers, and where a declared workspace that is not the starting one
claims `gated`:

1. While nobody is known, the address opens as a tab and the gated content explains itself.
2. The session arrives. The content router reloads the address, the gated route matches, and the
   container host is created. It lays out its children and focuses `design`.
3. The identity arrives with the session, so the stores adopt the person's namespace, and
   `WorkbenchOpening.rereadForAdoptedNamespace` enters the workspace that claims the address. Entering
   it replaces the whole pane state with the one stored for that workspace, which in a fresh namespace
   holds only the declared arrangement. The container's dock is not part of it.
4. The F-038 fix puts the address tab back into the new arrangement. The host that draws it is still
   the one from step 2, so its constructor does not run again. Its dock is gone, its tree is an empty
   leaf, and `leadUrl` sees no focused child and rewrites the address from `gated/one/design` to
   `gated/one`. The empty inner pane draws whatever the empty address resolves to: the home surface in
   the testbed, "View not available" in NextPA, which has no content at the empty address.

Every variant without the claiming workspace, or with the identity known at boot, passes: then
nothing replaces the pane state while the container is open. That is why the F-032 test, which
checked only the router, and the F-038 test, which used routes without an inner arrangement, both
missed it.

## Goals / Non-Goals

**Goals:**
- An open container always has its inner arrangement. Whatever removes the dock while the container
  is on screen, the container lays it out again from its declaration and focuses the child the
  address names, as it does when it is first opened.
- The address keeps naming the child throughout.
- A regression test in the merge gate that fails on 0.14.4, and a browser case in the testbed.

**Non-Goals:**
- Carrying the inner arrangement built while nobody was known into the claiming workspace. That
  arrangement was built behind an access placeholder and holds nothing the person arranged, so laying
  it out again from the declaration loses nothing.
- Re-focusing a container whose dock is *replaced* by a stored one rather than removed (the person's
  stored namespace already holds an arrangement for this exact container). The stored focus then
  wins over the address, as it does today. Nothing reported shows it, and it would need a signal for
  "the whole arrangement was replaced", which the F-037 and F-038 follow-up deliberately removed.

## Decisions

**The container host owns its dock and restores it when it is gone.** `followUrl` reads whether the
dock exists. When it does not, it lays the dock out again (`ensureContainer`, which is idempotent) before
opening the child the address names. Because `followUrl` is created before `leadUrl`, the dock and its
focus are back before `leadUrl` compares the focus with the address, so the address is never rewritten.

**Only the dock's existence is read, through a computed boolean.** The first attempt read
`hasDock` straight from the dock map. That made `followUrl` run on every change to any arrangement,
including the click that focuses another child: it ran before the address had followed the click and
put the old child back. A computed boolean notifies only when the dock appears or disappears. The
unit test pins the click, and fails on the first attempt.

*Alternatives considered:*
- **Carry the container docks of the kept address across the workspace switch.** It would keep the
  arrangement built while nobody was known, which has no value (see Non-Goals), and it puts
  container knowledge into the workspace switcher. The same gap would stay open for every other
  path that replaces the pane state. Rejected.
- **Do not switch workspaces when the adopted namespace answers with nothing.** It would keep the
  arrangement in this case only, and it changes when a claimed address activates its workspace,
  which the workspaces capability states. Rejected.
- **Recreate the host after a replacement.** The host is held by retention on purpose, so that a
  container keeps its state across moves. Forcing a new instance would lose that. Rejected.
- **Stop `leadUrl` from writing the address while the tree is empty.** Keeps the address but leaves
  the container empty. Rejected as the only change; it is unnecessary once the dock is restored.

## Risks / Trade-offs

- [The host now restores a dock that something removed on purpose] → The only path that removes a
  container's dock on purpose is the dock garbage collection, and it keeps the dock of the container
  the address is on. It drops the dock of a container whose tab is not the active content, and that
  container's host is not running then. Checked in the testbed: leaving the container's tab for its
  sibling and coming back runs no loop, and the page stays responsive.
- [A container declared without an initial arrangement has no dock until a child opens] → Laying it
  out again is a no-op for such a container, and opening the addressed child creates the dock, as it
  does on first open. The effect runs again only when the dock's existence changes, so it cannot
  loop.
