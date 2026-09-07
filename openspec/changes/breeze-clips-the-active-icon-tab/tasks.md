## 1. Reproduction

- [ ] 1.1 Reproduce the cut in the Breeze look: viewport, panel side, number of views in the panel,
      and whether the strip's row is scrolled. Record which box clips in `design.md`.
- [ ] 1.2 Decide from the reproduction whether the strip or the look is at fault. Where it is the
      strip, update this change with a delta to the capability carrying the strip and remove
      `skip_specs` before going on.

## 2. The fix

- [ ] 2.1 Fix the cause where it lives, so that a fully rounded active icon tab is drawn whole.
- [ ] 2.2 Check every look the demo ships at the reproduced viewport, since the same cut would hide
      in the others' smaller radius.

## 3. Proving it

- [ ] 3.1 Add the demo end-to-end check that the active icon tab of a sidebar header is not clipped
      in any shipped look at the reproduced viewport.

## 4. Verification

- [ ] 4.1 Run what the fix touches: the shell tests where the strip changed, the demo suites.
- [ ] 4.2 Run `openspec validate --all --strict`.
