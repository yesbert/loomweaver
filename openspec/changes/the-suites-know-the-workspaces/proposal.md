> **Status:** approved

## Why

Both end-to-end suites have been failing since the night of 2026-08-28, and both for the same
reason: `2026-08-27-a-workspace-claims-its-content` gave a workspace the ability to claim content
addresses, declared claims in the demo and in the testbed, and carried only the demo's suite along.

**The demo.** Eleven tests in the quotes area fail, every one of them because the list they look for
is not on the page. It is not on the page because they ask for a workspace that no longer exists.
The demo declares three: `dashboard` is `initial` and claims `''`, `quotes` claims `quotes/:id` and
seeds the quote list into its left panel, `payments` claims `payments`. The suite still seeds
`lw.shell.active-workspace` with `default`, a workspace from before that arrangement, and then
expects the quote list at `/`. That address now belongs to the dashboard, whose left panel is
declared empty on purpose.

**The testbed.** Forty-four of 294 tests fail, and the job is killed by its thirty-minute limit
before it can even report, because each failure is retried twice and fifteen of them are timeouts.
The cause was isolated by running one failing test either side of the commit: at `e1d9883f` it
passes, at `d63086da` it fails. That commit added one line to the testbed's review workspace,
`claims: ['entry/:id']`. Almost every test in the suite opens an entry through the same helper, so
almost every test now triggers a workspace switch it was never written for: the tree is rebuilt, the
element under the cursor is detached mid-click, and the review workspace brings a different layout,
which is why assertions report three split handles where they expect one.

In both cases the workbench does exactly what the archived change specified. The tests describe a
product that no longer exists. That is the worst kind of red: it costs the same attention as a real
defect every morning, and it teaches the reader to ignore the suite.

## What Changes

**The demo suite is told which workspace it needs.**

- The tests that need the quote list activate the `quotes` workspace instead of `default`, and the
  ones that check the dashboard activate `dashboard`. Which workspace a test runs in becomes an
  explicit part of its setup rather than a leftover.
- The comment above the seeding says what it now does. It currently explains that the list is a
  docked surface with no URL, which is still true, and implies that seeding `default` reaches it,
  which is not.
- `workspace.spec.ts` is read against the same rule, since it also seeds a workspace by id.

**The testbed stops claiming the address its whole suite is built on.**

- `claims: ['entry/:id']` comes off the testbed's review workspace. Forty-four tests about panes,
  tabs, focus and accessibility are not the place to exercise a workspace switch, and rewriting them
  to expect one would bury what they are actually for.
- One testbed spec is written for claiming, on an address that no other test uses, so the platform
  keeps end-to-end coverage of the feature instead of losing it. What the feature guarantees is
  already held by three unit spec files and by the demo's own suite.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No guarantee changes: the workbench behaves as `workspaces` and the archived change specify.
The demo's declarations stay as they are, the testbed's change is a distribution's own choice about
what it demonstrates, and nothing a consumer could notice moves. The change therefore declares
`skip_specs: true`.

## Impact

- `demo/e2e/quotes.spec.ts`, `demo/e2e/quotes-document.spec.ts`, `demo/e2e/workspace.spec.ts`, the
  three files that seed `lw.shell.active-workspace`.
- `platform/apps/loom-testbed/src/main.ts`, one line on the review workspace.
- `platform/apps/loom-testbed-e2e/src`, one new spec for claiming.
- The nightly workflow, failing on both jobs since 2026-08-28 03:00 UTC, first on Azure and then on
  GitHub after the move. The failure predates the move by four hours; the move only made it visible
  again.
