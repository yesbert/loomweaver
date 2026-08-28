## 1. Reproduce first

- [ ] 1.1 Run `npx playwright test` in `demo/` and record exactly which tests fail and on which
      assertion, so the fix is judged against a written-down starting point rather than a memory.
- [ ] 1.2 Confirm from the failure snapshot that the application is healthy and only the quote list
      is missing — the dashboard renders and its figures are right.

## 2. The fix

- [ ] 2.1 In `demo/e2e/quotes.spec.ts`, seed `lw.shell.active-workspace` with `quotes` and correct
      the comment above it: the list is a docked surface with no URL, and it lives in the workspace
      named after it.
- [ ] 2.2 Do the same in `demo/e2e/quotes-document.spec.ts`.
- [ ] 2.3 Read `demo/e2e/workspace.spec.ts` against the same rule and correct it if it seeds a
      workspace that no longer exists.
- [ ] 2.4 Check the remaining spec files for any other assumption about which workspace is active.

## 3. Prove it

- [ ] 3.1 Run the demo suite: all tests green.
- [ ] 3.2 Calibrate in the other direction: remove `quotes` from the quotes workspace's left panel,
      confirm the same eleven tests fail, restore it. A test that passes either way proves nothing.
- [ ] 3.3 Run the testbed suite as well, so the change is judged against both.
- [ ] 3.4 Let one nightly run green before calling this done.
