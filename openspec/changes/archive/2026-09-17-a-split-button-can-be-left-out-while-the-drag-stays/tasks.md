## 1. The switches

- [x] 1.1 In `platform/libs/core/shell/src/lib/foundation/shell-features.ts`, add
  `splitRightButton` and `splitDownButton` to `ContentFeatures`, on by default, with JSDoc naming
  the route each leaves out and the handles for the routes they do not touch.
- [x] 1.2 Confirm that nothing in `merge-shell-features.ts` needs changing, and that the suite
  covering every switch picks the two new ones up.
- [x] 1.3 Merge a directly provided `SHELL_FEATURES` over the defaults in
  `feature-switches.service.ts`, so a set assembled before a switch existed answers that switch's
  default instead of leaving a reader to call `undefined`; test it with a set that names one switch
  of the group only.

## 2. The button

- [x] 2.1 `pane-view.ts` and `content-area.ts` draw the split control where the capability is on and
  its own switch is on, so the floating toolbar of an empty pane follows too.
- [x] 2.2 Test: with only the button switches off, no pane toolbar draws a split control while the
  capability still answers on.
- [x] 2.3 Test: with the capability off and the button switch on, no control is drawn.
- [x] 2.4 Test: with only the button switches off, the four drop edges stay; with the capability
  off, the split edges go.
- [x] 2.5 Test the address pane's own toolbar in `content-area.spec.ts`, not only `PaneView`: both
  controls for the full workbench, neither with the buttons switched off, neither with splitting
  off. Confirmed each new test fails with its condition removed.

## 3. The written contract

- [x] 3.1 `llms-full.txt`: `ContentFeatures` carries the two switches, with the three handles for
  splitting beside it (the switch, `omit` of the command, `omit` of the `menu:` entry).
- [x] 3.2 `docs/distribution/switching-capabilities-off.md` and
  `platform/libs/tooling/devkit/src/recipes/angular-distribution/readme.ts`: both say a switch takes
  the affordance and the gesture, so both name the exception and where the other routes are handled.
- [x] 3.3 Run `openspec validate --all --strict`, the shell and devkit suites, and the repository's
  guards, then reconcile this change's artifacts with what was built.
- [x] 3.4 The testbed's initial bundle crosses its recorded ceiling by a rounding step (894.7 kB to
  895.0 kB of 895), so raise that one ceiling with the guard's own `--write-baseline`, deliberately
  and named in the pull request.
