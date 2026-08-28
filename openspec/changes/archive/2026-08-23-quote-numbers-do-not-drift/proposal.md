> **Status:** approved.

## Why

The demo's quote numbers wander with the calendar, and five tests are written as though they do not.

The dates are relative on purpose — a demo whose newest quote is two days old never looks abandoned —
but the number is built from the *issue* date: `Q-<year of issue>-<sequence>`. So the year in a
number is a function of when you look at it. Pinning the reference date and rebuilding shows exactly
when each seed crosses:

| From | The number becomes |
|---|---|
| 2027-01-03 | `Q-2027-0007` |
| 2027-01-06 | `Q-2027-0006` |
| 2027-01-10 | `Q-2027-0005` |
| 2027-01-15 | `Q-2027-0004` |
| 2027-01-27 | `Q-2027-0003` |

Nothing happens on New Year's Day, which is what makes this easy to misjudge: on 1 January every
issue date still falls in the old year. The failures start on the third and arrive one at a time, so
this is not one red morning a year but five, each needing the same hand edit in a different file.

The sharper half is that two of the affected files are not tests. `demo/public/api/open-items.json`
and the statement inside `demo/public/payments/view.js` are what the payment plugin *shows*. From
2027-01-03 the payments area says `Q-2026-0007` while the quote list beside it says `Q-2027-0007`,
and nothing looks broken — the plugin's statement and its data are both frozen, so they still agree
with each other and the matching still works. The demo simply contradicts itself, quietly.

## What Changes

- The quote number stops carrying a year: `Q-0007` rather than `Q-2026-0007`. The issue date stays
  relative, so the demo still looks current, and the number stops being a function of when you look.
- The scenario asserting that the number follows the year it was issued in goes, because that is the
  behaviour being removed.
- The five files carrying a pinned number are updated once, and never again.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The demo is a product built on the platform and carries no capability of its own, so nothing
the platform guarantees changes. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

- `demo/src/accounting/quotes.ts` — the number format, and only that; dates, seeds and totals are
  untouched.
- `demo/src/accounting/quotes.spec.ts` — the reference-date scenario loses the half about the year in
  the number and keeps the half about the dates.
- `demo/public/api/open-items.json` and `demo/public/payments/view.js` — the pair that must keep
  agreeing with each other.
- `demo/e2e/quotes-document.spec.ts`, `demo/e2e/workspace.spec.ts`, `demo/e2e/payments.spec.ts` —
  pinned numbers.
- Nothing published changes, so no consumer is affected and no release is needed.

Nothing is dissolved: no decision record, guide or specification is superseded by this change.
