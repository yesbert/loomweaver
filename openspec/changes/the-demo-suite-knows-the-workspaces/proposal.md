> **Status:** proposed — not approved for implementation yet.

## Why

The demo's smoke suite has been failing since the night of 2026-08-28, eleven tests in the quotes
area, every one of them because the list it looks for is not on the page. It is not on the page
because the tests ask for a workspace that no longer exists.

`2026-08-27-a-workspace-claims-its-content` gave a workspace the ability to claim content addresses,
and the demo declared three of them: `dashboard` is `initial` and claims `''`, `quotes` claims
`quotes/:id` and seeds the quote list into its left panel, `payments` claims `payments`. The suite
still seeds `lw.shell.active-workspace` with `default`, a workspace from before that arrangement,
and then expects the quote list at `/`. That address now belongs to the dashboard, whose left panel
is declared empty on purpose.

So the platform does exactly what the change specified, and the tests describe a product that no
longer exists. That is the worst kind of red: it costs the same attention as a real defect every
morning, and it teaches the reader to ignore the suite.

## What Changes

- The tests that need the quote list activate the `quotes` workspace instead of `default`, and the
  ones that check the dashboard activate `dashboard`. Which workspace a test runs in becomes an
  explicit part of its setup rather than a leftover.
- The comment above the seeding says what it now does. It currently explains that the list is a
  docked surface with no URL, which is still true, and implies that seeding `default` reaches it,
  which is not.
- `workspace.spec.ts` is read against the same rule, since it also seeds a workspace by id.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No guarantee changes: the workbench behaves as `workspaces` and the archived change specify,
and the demo's declarations are already what they should be. Only the tests move. The change
therefore declares `skip_specs: true`.

## Impact

- `demo/e2e/quotes.spec.ts`, `demo/e2e/quotes-document.spec.ts`, `demo/e2e/workspace.spec.ts` — the
  three files that seed `lw.shell.active-workspace`.
- The nightly workflow, which has been failing on the demo job since 2026-08-28 03:00 UTC — first on
  Azure, then on GitHub after the move. The failure predates the move by four hours; the move only
  made it visible again.
