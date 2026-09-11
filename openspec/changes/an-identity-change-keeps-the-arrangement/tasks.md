## 1. The arrangement survives an identity being adopted

- [ ] 1.1 Write a failing test that names the larger fact: immediately after an anonymous session
      adopts an identity, the container still holds the panes it held before. Put it in the unit
      suite if the adoption is reachable there, because that suite runs in the merge gate; leave it
      end-to-end only if a real reload is genuinely required.
- [ ] 1.2 Write a failing test that the gated pane's explanation is continuous across the adoption:
      it reads as signed out before, reads as lacking the role after, and is never absent.
- [ ] 1.3 Locate the cause on the adoption path. Record in `design.md` what it turned out to be,
      because the investigation found where it is not and the next reader should not repeat that.
- [ ] 1.4 Fix it, and make both tests pass without weakening the existing tests around adoption and
      around the pane tree.
- [ ] 1.5 Confirm the testbed end-to-end test `a gated container child keeps its pane and shows the
      access placeholder until the role arrives` passes unchanged, without being edited to suit the
      fix.

## 2. The stale test asserts the current guarantee

- [ ] 2.1 Correct `the choice is remembered, so switching away survives a restart` to assert what
      the platform now guarantees: an opening at an address that names no content lands in the
      declared workspace, the first time and every time after. Rename it for what it now says.
- [ ] 2.2 Read the rest of that spec file for the same staleness, and correct whatever else still
      encodes the behaviour that governed only a first visit.
- [ ] 2.3 Search the end-to-end suite for other tests resting on the superseded rule, so this is not
      found again one red run at a time.

## 3. The suite means something again

- [ ] 3.1 Run the whole testbed end-to-end suite and confirm it is green.
- [ ] 3.2 Run the unit suites and the repository guards, so the fix has not moved a cost elsewhere.
- [ ] 3.3 Run `openspec validate --all --strict`.
