## Context

See proposal.md, *Why*. What shapes the approach is how little is missing.

Measured on the running demo at a plugin address with the plugin uninstalled: the address stays and
the content area shows the unavailable placeholder. The router already builds that placeholder for an
address it is waiting on, and separately for an address a distribution removed. That half works.

What no one does is ask which workspace claims the address. The active workspace stays whatever it
was, which after a fresh start is the one claiming the starting address, so the placeholder is read
under the wrong sidebar.

Workspaces already say which addresses belong to them, and the workspace machinery already resolves
an address to the workspace that claims it, since that is how switching to an address enters the
right workspace.

So the missing piece is one question asked at one moment: when an address is answered by the
placeholder rather than by content, ask which workspace claims it and make that one active.

## Goals / Non-Goals

**Goals:**

- Never move a user out of the place they addressed without saying why.
- Reuse the explanation the workbench already shows, so one situation has one wording.
- Leave a mistyped address exactly as it is today.

**Non-Goals:**

- Repairing the arrangement. A stored arrangement that names a gone address is already handled and
  keeps working; this change is about where an address lands, not about what is stored.
- Telling a plugin that its address was asked for while it was gone. Nothing has asked for that, and
  it would be a new surface rather than a fix.
- Distinguishing "never existed" from "was removed" in the wording. The user's question is why they
  are not looking at what they asked for, and that answer is the same.

## Decisions

**The claim decides, not the shape of the address.** An alternative is to treat any address whose
first segment matches a known prefix as claimed. That would guess where a workspace's boundary lies
and would answer differently for a product that claims deliberately narrow addresses. Asking the
workspace machinery costs one call and is right by construction.

**The explanation is left exactly as it is.** It already says the right thing in the right place; a
second, more specific wording — "the plugin that showed this was removed" — would have to be
maintained in every language and would be wrong whenever the address was never answered by anything.
The change touches where the user stands, not what they read.

**Waiting keeps precedence.** A deep link that arrives before its plugin is the ordinary case and is
already quiet. The explanation therefore only applies once waiting has given up, and the change adds
nothing to the waiting path.

## Risks / Trade-offs

- **A product that claims an address and never fills it now enters that workspace instead of the
  starting one.** That is the point, but it is a visible change for such a product. Mitigation: it is
  a change in an unanswered case, where the previous behaviour said nothing at all.
- **The router asks the workspace machinery.** A dependency from routing towards workspaces exists
  already for switching, so no new direction is introduced. Mitigation: keep the read one-way and
  make it a query, never a switch performed by the router.

## Open Questions

None.
