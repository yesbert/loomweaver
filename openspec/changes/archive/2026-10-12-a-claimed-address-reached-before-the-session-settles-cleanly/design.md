## Context

Content with an access requirement has two routes at its address: one that matches when the session
qualifies, and a placeholder that explains the refusal. Only the first settles the workspace. That is
deliberate: a person who may not see the content is not moved into a workspace built for it. The
placeholder's tab therefore opens in whatever workspace is active.

When the session qualifies, the workbench navigates the same address again, the real route matches,
and settling moves into the claiming workspace. Where the session adopts a namespace, the restart
path also re-reads the arrangement and switches to the workspace the shown address belongs to. Both
switches leave the waiting workspace's arrangement as it was, provisional tab included, and the
adoption writes it to the person's namespace where that is empty.

## Goals / Non-Goals

**Goals:**

- The workspace a gated visit waited in ends up as it was before the visit.

**Non-Goals:**

- Repairing arrangements already stored with the stray tab. Reading never rewrites stored content,
  and a tab at another workspace's address may also be there because declarations changed.
- Moving the person into the claiming workspace before the session qualifies.

## Decisions

**Remember the withheld visit, and undo exactly that on settling.** The placeholder route records
the address and the workspace it opened in, but only when another workspace claims the address and
the waiting workspace did not already hold content of that family. The settling switch, and the
restart path's switch, take out the tabs of that family from the waiting workspace before leaving
it, while it is still the active one, so the corrected arrangement is what gets written.

Alternatives considered:

- *Let the placeholder settle too.* The person would land, signed out, in a workspace whose content
  they cannot see, which the gated-content scenarios rule out ("once the session qualifies, the
  claiming workspace becomes active").
- *Drop tabs at another workspace's claimed address whenever an arrangement is read*, as the finding
  proposed. It contradicts "Stored content that contradicts a current declaration is kept and
  recognised", and it would also remove tabs the person kept after a product changed its claims.
- *Remove any tab of the settled family from the workspace being left, on every settle.* Simpler, but
  it would take away a tab the person had there before, for example one stored before a claim was
  added.

## Risks / Trade-offs

- [The record outlives the visit if the session never qualifies] → It is replaced by the next
  withheld visit and cleared by the next settle, and it only acts when the family and the workspace
  both still match.
- [The anonymous namespace keeps the provisional tab] → It is state of the anonymous session itself,
  shown again only to an anonymous visit, where explaining the refusal is what the address does.
