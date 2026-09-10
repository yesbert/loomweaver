## Context

See proposal.md — Why. Two rules already in place produce the empty section between them: the switch
is withheld for a plugin the distribution declared not optional, and the right to register
contributions is filtered out of the revocable set because withdrawing it would disable a plugin
while pretending to narrow it. Both are right on their own; nothing looked at what they leave.

## Goals / Non-Goals

**Goals:**

- The page shows what can be permitted, and nothing else.
- One rule, read at the point where the rows are built, rather than a special case in the
  template.

**Non-Goals:**

- No new place to show what an application is made of. That is a fair thing for a product to want and
  a different question from what each part may do; it wants its own surface, not a row on this one.
- No change to what is revocable, to the switch's rules, or to what a distribution may declare.

## Decisions

**The row is dropped where there is neither a switch nor a capability that can be withdrawn.** Both
halves matter: a plugin with a switch stays even with an empty list, because the switch is something
to operate; a plugin without a switch stays where its capabilities are listed, because seeing what an
operator-deployed part holds is worth the row even when the toggles are withheld.

**Filtering where the rows are built, not in the template.** The template already carries three
conditional shapes; a fourth would make it the place where the rule lives. The rows are a computed
list, and a list that excludes what has nothing to say is easier to test than a template branch.

**The empty state is the existing one.** A distribution whose parts are all required and
contribution-only now sees the page's own "nothing here" line, which is true and already translated.

## Risks / Trade-offs

- **A user looking for a plugin they know is installed does not find it here.** → It was never
  operable here. The plugin store lists what is installed; this page lists what may be permitted.
- **A consumer asserted the old wording.** → Named in the proposal, and the requirement is changed
  rather than quietly reinterpreted.
