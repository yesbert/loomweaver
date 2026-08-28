## 1. Reproduce first

- [x] 1.1 Run `npx playwright test` in `demo/` and record exactly which tests fail and on which
      assertion, so the fix is judged against a written-down starting point rather than a memory.
- [x] 1.2 Confirm from the failure snapshot that the application is healthy and only the quote list
      is missing — the dashboard renders and its figures are right.
- [x] 1.3 Run the testbed suite and record its 44 failures the same way.

## 2. The demo suite

- [x] 2.1 In `demo/e2e/quotes.spec.ts`, seed `lw.shell.active-workspace` with `quotes` and correct
      the comment above it: the list is a docked surface with no URL, and it lives in the workspace
      named after it.
- [x] 2.2 Do the same in `demo/e2e/quotes-document.spec.ts`.
- [x] 2.3 Read `demo/e2e/workspace.spec.ts` against the same rule and correct it if it seeds a
      workspace that no longer exists.
- [x] 2.4 Check the remaining spec files for any other assumption about which workspace is active.

## 3. The testbed

- [x] 3.1 Take `claims: ['entry/:id']` off the review workspace in
      `platform/apps/loom-testbed/src/main.ts`.
- [x] 3.2 Confirm the 44 failures are gone and that no test that was passing has started failing.
- [x] 3.3 Write one testbed spec for claiming, on an address no other test opens, so the platform
      keeps end-to-end coverage of the feature.
- [x] 3.4 Calibrate that spec: with the claim removed from the workspace it tests, it must fail. A
      test that passes either way proves nothing.

## 4. Prove it

- [x] 4.1 Run the demo suite: all tests green.
- [x] 4.2 Calibrate in the other direction: remove `quotes` from the quotes workspace's left panel,
      confirm the same eleven tests fail, restore it.
- [x] 4.3 Run the whole testbed suite: all tests green.
- [ ] 4.4 Let one nightly run green before calling this done, and confirm the testbed job finishes
      well inside its thirty-minute limit.
