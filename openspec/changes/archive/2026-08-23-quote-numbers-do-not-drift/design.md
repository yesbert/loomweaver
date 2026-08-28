## Context

See proposal.md — Why. What shapes the approach is that the year in the number buys nothing and costs
a maintenance appointment every January.

The demo dates relatively so that it never looks abandoned, and that is worth keeping. The number is
derived from that date, which is where the two properties collide: a value meant to be *stable
enough to write down* is computed from a value meant to *move*. Everything downstream — a JSON file
served to a plugin, a bank statement inside that plugin, five test literals — writes it down.

One property of the affected pair matters more than the rest. The plugin's statement references and
the open-items file must agree, or the matching finds nothing and all three outcomes collapse into
"unassigned". They agree today because both are frozen. Any fix that regenerates one of them without
the other turns a quiet inconsistency into a visibly broken demo, which is the trap this note exists
to mark.

## Goals / Non-Goals

**Goals:**

- A quote number that means the same thing in January as in August.
- The demo's dates stay relative, so nothing about how current it looks changes.
- The class of failure disappears rather than being detected: no annual appointment, no tripwire to
  keep watching.

**Non-Goals:**

- **Freezing the reference date.** That would fix the number by breaking the reason the dates are
  relative. The seam stays exactly as it is, tests included.
- **Generating the open-items file.** It was considered and rejected when the payment plugin was
  designed, and this change does not reopen it — with a stable number there is nothing left to drift.
- **Touching amounts, seeds or totals.** Those never drifted; only the number did.
- **Renumbering the quotes.** The sequence stays what it is, so `q-0007` is still `0007`.

## Decisions

### The number is the sequence, with no year in it

`Q-0007`. Stable for the life of the demo, and plausible as a document number — plenty of real
systems number without a year.

*Why not keep the year but take it from a fixed anchor in the seed* — then a quote issued in January
2027 would be numbered `Q-2026-0007`, and a number disagreeing with the date printed beside it is a
worse artefact than a number with no year at all. It trades a drift nobody sees for an inconsistency
an accountant sees immediately.

*Why not take the year from today rather than from the issue date* — every number would then roll
over together on 1 January instead of one at a time. One red day instead of five is an improvement in
degree, not in kind, and a quote issued in December would be renumbered into the new year overnight.

*Why not compute the expected number in the tests and leave the format alone* — that fixes the five
test files and leaves the two runtime files wrong, which is the half of the problem that shows on
screen rather than in CI.

### The pair is updated together, in one step

The open-items file and the plugin's statement are edited as one task rather than two, and the
existing unit test — which computes the open items from the accounting library and compares them to
the file — proves the first half. The second half has no test, so the end-to-end case asserting that
all three outcomes are present is what catches a statement left behind: if the references stop
matching, "amounts agree" and "amounts differ" both disappear.

That is worth stating plainly, because it is the whole reason the two files are one task: the suite
already fails loudly if they are edited apart.

## Risks / Trade-offs

- **A number without a year reads as less realistic.** → Marginal, and the demo gains a number that
  is the same on every screenshot ever taken of it.
- **The pair could still be edited apart by someone later.** → The end-to-end case asserting all
  three outcomes fails when the references stop matching, so apart-editing is caught rather than
  shipped.
- **The reference-date scenario loses an assertion.** → It keeps the half that matters — that seeds
  are dated against the reference date — and loses only the half asserting the behaviour being
  removed.

## Migration Plan

Nothing to migrate: the demo deploys as a whole, holds no stored data keyed by quote number, and
nothing outside it reads these numbers.
