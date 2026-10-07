## 1. Pin the defect

- [ ] 1.1 `identity-change.spec.ts`: a different subject after a sign-out replaces the location with the served base, not the current address; see it fail on the current code
- [ ] 1.2 The same file: under a served base of `/app/`, the target is `/app/`
- [ ] 1.3 The same file: in a pop-out window the window closes, and opens the start where the close is refused
- [ ] 1.4 Testbed: a browser case that signs in as one person at an address below the root, signs out, signs in as another, and asserts the address after the single reload is the start; see it fail on the current code

## 2. Fix

- [ ] 2.1 `IdentityChangeReload`: replace the location with `ServedBase.path`; close a pop-out window first
- [ ] 2.2 Run 1.1 to 1.4 green, with the existing cases in `identity-change.spec.ts`

## 3. Verify

- [ ] 3.1 The full shell suite
- [ ] 3.2 The testbed's auth and pop-out suites in the browser
- [ ] 3.3 Lint for the shell and the testbed

## 4. Close

- [ ] 4.1 The JSDoc of `onIdentityChange`, `docs/distribution/auth.md` and `llms-full.txt` say where the reload lands
- [ ] 4.2 `openspec validate --all --strict`
- [x] 4.3 Note in the PR that this closes NextPA finding F-046
