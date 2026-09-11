## 1. The arrangement survives an identity being adopted

- [x] 1.1 Pin the larger fact with a failing test: immediately after an anonymous session adopts an
      identity, the container still holds the panes it held before. It lives in the unit suite, which
      runs in the merge gate, in the adoption harness that already renders content.
- [x] 1.2 Leave the gated pane's explanation to the end-to-end test that already asserts it, since
      the placeholder needs a rendered access decision. The unit pin covers the arrangement, which is
      what the placeholder hangs on.
- [x] 1.3 Locate the cause on the adoption path and record it in `design.md`, together with what the
      search ruled out on the way.
- [x] 1.4 Fix it, and make the pinning test pass without weakening the existing tests around adoption
      and around the pane tree.
- [x] 1.5 Confirm the testbed end-to-end test `a gated container child keeps its pane and shows the
      access placeholder until the role arrives` passes unchanged, without being edited to suit the
      fix.

## 2. The stale test asserts the current guarantee

- [x] 2.1 `the choice is remembered, so switching away survives a restart` now reads `a user last in
      another workspace still opens in the declared one`, and asserts what the platform guarantees:
      an opening at an address that names no content lands in the declared workspace, the first time
      and every time after.
- [x] 2.2 Read the rest of that file. The other three tests hold under the current requirement; only
      the file's own heading still said `a fresh install`, and it now says `an opening`.
- [x] 2.3 Searched the end-to-end suite for the superseded rule. Only this file declares a starting
      workspace at all, so no other test can rest on it.

## 3. The suite means something again

- [ ] 3.1 Run the whole testbed end-to-end suite and confirm it is green.
- [ ] 3.2 Run the unit suites and the repository guards, so the fix has not moved a cost elsewhere.
- [ ] 3.3 Run `openspec validate --all --strict`.
