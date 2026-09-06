## Context

See proposal.md, *Why*. What shapes the approach is that both halves already exist.

The content router builds its routes from what is registered, and adds a placeholder route for every
address a distribution removed, so such an address keeps its place and explains itself. The same
placeholder answers an address the session may not reach. What has no case is an address that is
neither registered nor removed: it falls through to the router's own catch-all, which is the
starting screen.

Workspaces already say which addresses belong to them, and the workspace machinery already resolves
an address to the workspace that claims it, since that is how switching to an address enters the
right workspace.

So the missing piece is a decision, not a mechanism: before the catch-all takes an unmatched address,
ask whether a workspace claims it.

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

**The explanation is the existing one.** A second, more specific wording — "the plugin that showed
this was removed" — would be more precise and would have to be maintained in every language, and it
would be wrong whenever the address was never answered by anything. One wording for one situation.

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
