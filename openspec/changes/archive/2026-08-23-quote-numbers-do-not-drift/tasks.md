## 1. Pin the drift before removing it

- [x] 1.1 A test that pins the reference date past a year boundary and asserts the number is
  unchanged by it — red before the format changes, green after.

## 2. Take the year out

- [x] 2.1 The quote number is built from the sequence alone.
- [x] 2.2 The reference-date scenario keeps asserting that seeds are dated against the reference date
  and stops asserting a year in the number.

## 3. Update what wrote the old number down

- [x] 3.1 `demo/public/api/open-items.json` and the statement references in
  `demo/public/payments/view.js` in **one** step — they are a pair, and editing one without the other
  leaves the plugin matching nothing.
- [x] 3.2 The pinned numbers in `demo/e2e/quotes-document.spec.ts`, `demo/e2e/workspace.spec.ts` and
  `demo/e2e/payments.spec.ts`.

## 4. Verify

- [x] 4.1 Unit tests pass, including the one holding the open-items file to the accounting library.
- [x] 4.2 The end-to-end suite passes, and the payments case still finds all three match outcomes —
  which is what proves the pair was edited together.
- [x] 4.3 Re-run the section 1 test at a pinned date in the following year and confirm nothing moves.
