## 1. A reset ends the holds of its workspace

- [x] 1.1 Write a failing test: a surface acquired in the active workspace is held; resetting the
      workspace leaves it unheld.
- [x] 1.2 Write a failing test: a held surface the baseline no longer shows is ended after the reset,
      as an unheld one is.
- [x] 1.3 Let the stash end the holds of the entries acquired in one workspace, and call it for the
      active workspace before the baseline is applied.

## 2. Proof in the running workbench

- [x] 2.1 Rerun the sidebar reset probe with a held outline: after the reset it is no longer held, and
      it behaves as the unheld run did.

## 3. Saying it where consumers read

- [x] 3.1 Say in the view state guide and the brief that resetting the workspace ends the hold, and
      that the product learns it from the hold reading off.

## 4. Closing

- [x] 4.1 Run the unit suites and the repository guards.
- [x] 4.2 Run `openspec validate --all --strict`.
