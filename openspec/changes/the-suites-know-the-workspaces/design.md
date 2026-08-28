## Context

See proposal.md for motivation.

What the demo failure looks like: the suite goes to `/`, and Playwright's snapshot shows a complete,
working dashboard. The figures are right, `€22,758.37 across 2 open quotes`, `7 in total`, so the
data is loaded and the application is healthy. Only `[data-testid="quotes-list"] li` is absent,
because the dashboard declares `'left-panel': []`.

Eleven tests fail across two files. Four in `quotes.spec.ts` fail in `beforeEach` on the list; seven
in `quotes-document.spec.ts` time out waiting for a row in that same list.

What the testbed failure looks like: 44 failures across 19 spec files, spread over content, panes,
tabs, menus, retention and accessibility. The spread is the clue. A feature that broke one area
would fail in one area; this fails everywhere the helper `openEntry` is used, which is nearly
everywhere. The messages say the same thing twice over: `element was detached from the DOM,
retrying` while double-clicking an entry, and counts that come out too high, three split handles
where one is expected, two close buttons where one is expected.

Both were reproduced before anything was changed, and the testbed cause was isolated by running one
failing test at `d63086da` and at its parent `e1d9883f`, on the same machine with the same installed
dependencies.

## Goals / Non-Goals

**Goals:**

- The suite tests the demo that exists, and a green run means something again.
- Which workspace a test runs in is visible in the test rather than inherited from a seeded id that
  outlived its meaning.

- The testbed keeps end-to-end coverage of claiming, on an address of its own.

**Non-Goals:**

- Changing the demo. Its declarations are deliberate: the dashboard is the first thing a visitor
  sees and has no side panel; the quote list belongs to the workspace named after it.
- Changing the workbench. It behaves as specified.
- Adding a route that shows the quote list. It is a docked surface by design, which is what the
  comment in the suite already says.

## Decisions

### 1. Seed the workspace each test needs, and enter it at an address it claims

`quotes.spec.ts` and `quotes-document.spec.ts` seed `quotes`. Any test written against the dashboard
seeds `dashboard`. The seeding stays in `beforeEach` where it is.

Seeding alone is not enough, which is a correction to this design and was found by making the change
and watching it fail. The dashboard claims `''`, so a test that seeds `quotes` and then visits `/`
is carried straight back out into the dashboard before it can look at anything. Measured: seed
`quotes`, go to `/`, and the active workspace reads `dashboard` with no list on the page; go to
`/quotes/q-0005` instead and it reads `quotes` with all seven rows. The tests therefore enter
through an address the workspace claims.

Rejected: entering *only* through the address and dropping the seeding. It would work today, and it
would make every test in the file depend on claiming behaving correctly, so a regression in claiming
would read as ten broken quote tests rather than as one broken claim. Keeping both means the
workspace is stated explicitly and the address agrees with it.

What the tests had been relying on is worth writing down, because it explains why they passed for
months and then did not: seeding an id that matches no workspace used to leave the workbench in a
composition that showed every docked view at once, the quote list among them. Claiming `''` replaced
that fallback with a real workspace. The tests were not testing the demo, they were testing the
absence of a decision.

Rejected: giving the dashboard a quote list. It would make the suite pass by changing the product to
match its tests, which is backwards, and it would undo a deliberate design decision.

### 2. Take the claim off the testbed rather than teach 44 tests about it

The testbed's review workspace claims `entry/:id`, and `openEntry` is the fixture step of nearly the
whole suite. Every test that opens an entry therefore performs a workspace switch as a side effect
of its setup. The line comes off, and claiming is demonstrated in a spec written for it, on an
address no other test touches.

Rejected: rewriting the 44 tests to expect the switch. They are about panes, tabs, focus and
accessibility. Making each of them also assert a workspace change would bury what they are for, and
it would mean that the next regression in claiming reads as 44 broken pane tests rather than as one
broken claim. That is the same argument as decision 1, applied to the other suite.

Rejected: keeping the claim and giving the suite a second entry address that is not claimed. It
leaves the trap in place for whoever writes the next test, and the trap is invisible until the
nightly reports it a day later.

The trade-off is real and worth naming: the testbed is the platform's own shop window, and a feature
it does not demonstrate is one a reader will not see. That is answered by the dedicated spec, and by
the demo, which claims `quotes/:id` and keeps doing so.

### 3. A failing nightly is not a nightly

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
  workspace's left panel, watch tests fail, put it back. Measured: six fail without it.
- **The testbed's claim is only switched off, not gone** → It rides the key the testbed already uses
  for `initial`, so the one spec written for claiming turns it on and everything else runs without
  it. Calibrated in both directions: with the key, three pass; with the key deliberately misspelt,
  the two positive tests fail and the negative control still passes.
- **Other suites seed the same key** → `workspace.spec.ts` is read against the same rule rather than
  assumed correct because it currently passes.

## Migration Plan

1. Reproduce locally: four failures in `quotes.spec.ts`, seven in `quotes-document.spec.ts`.
2. Change the seeded workspace, one file at a time, and watch each file go green.
3. Calibrate: break the demo's declaration on purpose, confirm the tests fail again, restore it.
4. Take the claim off the testbed's review workspace and watch the 44 failures go.
5. Write the claiming spec on its own address, and calibrate it: it must fail with the claim removed
   from the workspace it tests.
6. Run the whole demo suite, then the whole testbed suite, so the change is judged against both.
