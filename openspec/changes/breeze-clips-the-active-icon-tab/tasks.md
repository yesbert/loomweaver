## 1. Reproduction

- [x] 1.1 Reproduce in the Breeze look and record which box clips in `design.md`. Found: nothing
      clips; the header rows beside the top bar do not share its height, so the header line steps.
- [x] 1.2 Decide from the reproduction whether the workbench or the look is at fault. The look:
      dimensions are a look's stylesheet business by the guide's own decision; `skip_specs` stays.

## 2. The fix

- [x] 2.1 Breeze gives the sidebar heads, their narrow-window boxes and their icon strips the top
      bar's height, and keeps the content strip's own.
- [x] 2.2 Check every look the demo ships at a wide and a narrow width.

## 3. Proving it

- [x] 3.1 Add the demo end-to-end check that, per look, the top bar and the sidebar heads share one
      bottom edge, wide and narrow.

## 4. Verification

- [x] 4.1 Run the demo suites.
- [x] 4.2 Run `openspec validate --all --strict`.
