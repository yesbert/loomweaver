## Context

See proposal.md, *Why*. What shapes both is that the mechanisms exist and only the way in is missing.

A registered surface lives as one entry in the contribution registry, keyed by id, and everything
that names it reads that entry. Replacing the entry already works, because a re-registration
overrides in place; measured in the demo, the panel header changed and the mounted view was not
rebuilt, keeping its scroll position and what the user had folded.

The active address is already published, signal-shaped, behind the same permission as driving the
content area. What is missing is not the address but the question asked of it.

## Goals / Non-Goals

**Goals:**

- Two additions small enough that a reader of the contract can hold both in their head.
- The segment rule lives in one place, so that nobody has to know it.

**Non-Goals:**

- A navigation tree, a registry of entries, or anything that knows what a module or an area is. That
  question is open and this change does not prejudge it.
- Changing anything else a declaration carries. A rename renames.

## Decisions

**A rename is its own operation, not a re-registration.** Registering again would work and is what
the demo does today, but it re-runs the whole path: normalisation, the dock warnings, the collision
check for a routable address. Running all of that to change one string is how a warning eventually
appears for something the plugin did not do. The registry replaces the title on the entry it already
holds.

**The rename reaches the title and nothing else.** Not the icon, though the demo's trick carried one
along. A caller who wants a different icon has a different need, and adding it now would be guessing
at it. Adding a second argument later is additive; taking one away is not.

**The address question is a method, not an exported predicate.** A free function comparing two
strings would be usable without a `ctx` and would put the segment rule in the caller's hands, which
is the thing worth avoiding: the rule is easy to state and easy to get wrong, and a caller who has
the rule will eventually inline it. Asking the workbench keeps one implementation. The cost is that
it cannot be used without a granted `ctx`, which is right, because the answer is about what the user
is looking at.

**It requires the permission that reading the active content requires.** It answers a narrower form
of the same question, and a narrower form of a gated answer is still the answer.

## What the tests can and cannot show

The assertion that a renamed surface is not rebuilt passes, and it also passes when the rename is
done the old way, by registering again. That is not a flaw in the test: re-registration does not
rebuild either, which is exactly why the demo's workaround worked at all. So the assertion
distinguishes nothing today and is kept as a guard against a future change that starts keying the
mounted component on the entry object. What it is not is evidence that the new way is gentler than
the old one; the argument for the new way is that it does not re-run registration, not that it
preserves more.

Checked by probe rather than assumed: the assertion was re-run against the old path and passed,
which is how the above is known rather than guessed.

## Risks / Trade-offs

- A rename that reaches a surface mounted in several places has to reach all of them, and a panel
  header, a tab strip and a picker each read the entry through their own path. → The scenarios name
  the panel header, and the test covers a surface named in more than one place at once.
- The segment rule has an edge nobody thinks about: the root address, which is the empty string.
  Under the rule as stated, everything lies under the root. → That follows from the same rule the
  workbench already applies to a claim on the root, so it is consistent rather than surprising, and
  the scenario for nothing-shown keeps the other end honest.
- Two additions to a published contract that exist because one product needed them. → Both are the
  kind that any second product hits immediately, and neither carries a shape that later work would
  have to unpick.
