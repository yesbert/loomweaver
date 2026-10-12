## Context

See proposal.md for the three gaps. A waiting visit opens its tab through the placeholder for content
the session does not qualify for. It can end in three ways: the address shown settles when the session
qualifies, the person is somewhere else by then, or the session adopts a namespace whose arrangement
replaces what was built while nobody was known.

## Goals / Non-Goals

**Goals:**

- Every waiting visit ends with its workspace holding what it held before, in all three cases.

**Non-Goals:**

- A visit that waited in a workspace the person has since left. Its tab is in that workspace's stored
  arrangement, which reading never rewrites, and it stays until the person closes it or resets that
  workspace.

## Decisions

**A service of its own for waiting visits.** The address settlement decides where an address belongs;
remembering visits, reacting to the session and taking tabs out is a second job, and keeping it apart
keeps both small.

**Remembered per address, taken out when they qualify.** The session change is the moment a waiting
visit stops waiting, so the service reacts to it and takes out every visit the person is not looking
at whose content the session now reaches. The visit shown is left to the settlement that its address
triggers, and that settlement also takes out the others, because it may run before the reaction to the
session does.

**Forget rather than take out when the arrangement is read again.** The arrangement adopted is the
person's own and holds nothing provisional, so there is nothing to take out of it.

Alternative considered: *take out the tab when the person leaves it while waiting.* The tab is how the
person gets back to the explanation and signs in, so removing it then would lose the way back.

## Risks / Trade-offs

- [A visit whose session never qualifies is remembered for the page's lifetime] → It holds an address
  and a workspace id, and it acts only when that address qualifies in that workspace.
