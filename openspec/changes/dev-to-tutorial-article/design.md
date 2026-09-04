## Context

See proposal.md, *Why*. What shapes the approach:

- The launch article exists and carries the story; it must not be retold. The new article is a
  different genre: a tutorial, where the reader learns something whether or not they adopt the
  project.
- The owner's voice is the differentiator and the constraint: long sentences, modest tone, no
  copywriter punch, "my own project" disclosed where the project first appears. The text starts
  from the owner's own draft; the assistant reorders and adds facts.
- The dash rule of the repository does not apply to dev.to, but the voice rule does.

## Goals / Non-Goals

**Goals:**

- A reader with the problem finishes the article knowing how to solve it by hand and what it
  costs.
- The project appears once, late, as the shortest way to the same result, with a link to the demo
  and the getting-started guide.

**Non-Goals:**

- No feature list, no architecture tour, no retelling of the launch story.
- No second article in this change; if the topic not chosen is worth writing, it is its own change.

## Decisions

**Topic is chosen tomorrow, between two.** Plugin isolation with iframes and RPC is the sharper
problem and the one where the project's answer is least common; the desktop-like workbench is the
broader draw. The decision is the owner's and is recorded here before the draft starts.

**Tutorial first, project last.** The structure is problem, hand-built solution, its cost, then the
project. The alternative, project first with the tutorial as illustration, is the launch article
again.

**Drafted in the owner's voice, from the owner's text.** As with the launch posts: the owner writes
the first version or dictates the argument, the assistant reorders and fills in facts, and the full
text is always shown whole, never as a fragment.

## Risks / Trade-offs

- [The tutorial half grows into a guide that belongs in `docs/`] → If the hand-built solution is
  worth documenting, it becomes a docs page and the article links to it; the article stays a story
  with one example.
- [The example rots] → Pin the versions in the example, and say so.

## Open Questions

- Which of the two topics. The outside review's default: plugin isolation with iframes, opaque
  origin and RPC, because it is framework-agnostic (the same article travels to a JavaScript
  audience) and because it does not invite a comparison with SCION Workbench that the first screen
  has not written yet. Its condition: the cost section says honestly that the hand-built version is
  about 150 lines and works, and that what the platform adds is the broker, the consent dialog and
  updates.
- Whether the example is a small repository or a pointer into the demo.
- Whether the outbound link carries `?ref=devto`, so the referrer survives. The positioning change
  decides the marker convention; this article follows it.
