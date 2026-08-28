## Context

See proposal.md for motivation.

What the failure looks like: the suite goes to `/`, and Playwright's snapshot shows a complete,
working dashboard. The figures are right, `€22,758.37 across 2 open quotes`, `7 in total`, so the
data is loaded and the application is healthy. Only `[data-testid="quotes-list"] li` is absent,
because the dashboard declares `'left-panel': []`.

Eleven tests fail across two files. Four in `quotes.spec.ts` fail in `beforeEach` on the list; seven
in `quotes-document.spec.ts` time out waiting for a row in that same list.

## Goals / Non-Goals

**Goals:**

- The suite tests the demo that exists, and a green run means something again.
- Which workspace a test runs in is visible in the test rather than inherited from a seeded id that
  outlived its meaning.

**Non-Goals:**

- Changing the demo. Its declarations are deliberate: the dashboard is the first thing a visitor
  sees and has no side panel; the quote list belongs to the workspace named after it.
- Changing the workbench. It behaves as specified.
- Adding a route that shows the quote list. It is a docked surface by design, which is what the
  comment in the suite already says.

## Decisions

### 1. Seed the workspace each test actually needs

`quotes.spec.ts` and `quotes-document.spec.ts` seed `quotes`. Any test written against the dashboard
seeds `dashboard`. The seeding stays in `beforeEach` where it is, so the diff is small and the
mechanism unchanged.

Rejected: navigating to a quote address and letting the claim move the workbench into the quotes
workspace. It would work — that is exactly what claiming does — but it would make every test in the
file depend on the claim behaving correctly, and then a regression in claiming would read as eleven
broken quote tests rather than as one broken claim.

Rejected: giving the dashboard a quote list. It would make the suite pass by changing the product to
match its tests, which is backwards, and it would undo a deliberate design decision.

### 2. A failing nightly is not a nightly

The suite failed on Azure at 03:00 on 2026-08-28 and would have failed every night after. Nothing
stopped the merge that broke it, because the end-to-end suites deliberately do not gate a pull
request — a standing decision to keep the gate fast, and one worth keeping.

The cost of that decision is that a nightly failure has to be read the next morning, and this one
was read only because the move surfaced it again. That is a process observation, not something this
change fixes; it belongs in the record so the next person knows the suite can rot for a day without
anybody noticing.

## Risks / Trade-offs

- **The tests pass for the wrong reason** → The verification is not "the suite is green" but "the
  suite is green and fails when the list is genuinely gone". Take the quote list out of the quotes
  workspace's left panel, watch the same eleven tests fail, put it back.
- **Other suites seed the same key** → `workspace.spec.ts` is read against the same rule rather than
  assumed correct because it currently passes.

## Migration Plan

1. Reproduce locally: four failures in `quotes.spec.ts`, seven in `quotes-document.spec.ts`.
2. Change the seeded workspace, one file at a time, and watch each file go green.
3. Calibrate: break the demo's declaration on purpose, confirm the tests fail again, restore it.
4. Run the whole demo suite, then the testbed suite, so the change is judged against both.
