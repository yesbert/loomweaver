## Context

See `proposal.md` — Why. The facts the decision rests on:

- The record has exactly one writer: the command search, at the moment the user picks an entry. Every
  other trigger — shortcut, rail item, bar button, menu entry, invocation by identity — runs the
  command through the seam and never touches it.
- The execution seam has no knowledge of the record and no reason to: it resolves an id, checks
  whether the command may run here and now, fires the behaviour and reports a failure. Nothing about
  it knows whether a person was involved.
- The requirement that overstates this predates the change that found it, so nothing shipped in
  reliance on the wider claim.

## Goals / Non-Goals

**Goals:**

- Make the two requirements that touch the record true, and make them agree with each other.
- Say *why* the record is narrow, so the next reader does not read it as an oversight and widen it.
- Pin the corrected statement with a test, so it cannot drift back.

**Non-Goals:**

- No change to what the workbench does. If this change alters an observable behaviour, it has gone
  wrong.
- No new control over the record. Whether a distribution keeps it at all is already a switch, and
  that stays exactly as it is.
- Nothing about the second search, over open work. It keeps no such record and none is proposed.

## Decisions

### Correct the requirement rather than widen the implementation

Two honest resolutions existed, and the choice between them is a product decision rather than a
tidying one.

**Chosen: say that the record is of what the user picked in the search.** The feature's whole value
is ordering the search by what you reach for *there*. A command you drive by its shortcut is one you
can already reach without searching; promoting it to the top of the search spends the most valuable
rows on entries the user never needed the search for, and pushes down exactly the ones the search
exists to surface. The narrow record is the better behaviour, so the requirement should describe it.

**Rejected: record on every user-driven trigger, in the seam.** It would make the original sentence
true, and it is not obviously wrong — "most used commands first" is a defensible feature. It is
rejected for two reasons. The first is the one above: it makes the search worse at its job. The
second is that "user-driven" is not a distinction the seam can make. A trigger arrives as a call; the
seam cannot tell a rail item the user clicked from a command another plugin invoked, and every way of
telling them apart means passing provenance down every route — a new concept threaded through the one
place that currently has no concept to thread.

That second point is worth stating in the spec's own terms, which is why the corrected requirement
about the seam says what the seam decides rather than merely dropping a clause. A reader who wonders
why the record is not uniform is told where the answer lives.

### State the narrowness as a property, not as an exception list

The corrected requirement names one writer and says no other trigger adds to it, rather than
enumerating the triggers that do not. An enumeration would need editing every time a new trigger
appears — invocation by identity was the most recent — and a list that has to be maintained is a list
that will one day be wrong.

The scenario about an invocation nobody chose is kept even so. It is the case that surfaced the
defect, and it is the one a reader is most likely to wonder about, so it earns a line of its own.

## Risks / Trade-offs

- **This narrows a published guarantee, and someone may have relied on the wider one.** → Nobody can
  have: the wider reading was never true of any release, so relying on it would have failed
  immediately. The correction removes a promise that was never kept rather than one that was.
- **A future contributor reads the narrow record as an oversight and widens it.** → The requirement
  carries the reason in its own text, and the design note carries the rejected alternative. Widening
  it later is then a decision made in the open rather than a fix to something that looks broken.
- **The correction is invisible: no test fails today and none would fail if it were wrong.** → The
  change adds the tests that pin it, which is the only thing that keeps a purely textual correction
  from drifting back.
