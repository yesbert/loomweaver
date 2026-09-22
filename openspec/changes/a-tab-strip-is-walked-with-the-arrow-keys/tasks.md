## 1. The directive

- [x] 1.1 Test first, in the directive's spec with a host of several tabs: exactly one tab is
  focusable, the selected one; the right and left arrow keys move the focus and wrap; Home and End
  jump; the selected tab stays selected; a handled key's default is prevented.
- [x] 1.2 Test: a key with Alt, Ctrl, Meta or Shift is left alone; a nested tab list is not walked
  into; once the focus leaves the strip the selected tab is the stop again; a removed tab hands the
  stop to the selected one.
- [x] 1.3 Implement the directive in `regions/pane/chrome/` and apply it to the tab list in
  `pane-tab-strip.html`.

## 2. In the workbench

- [x] 2.1 Test in `pane-tab-strip.spec.ts`: the rendered strip has one focusable tab, and Enter on a
  tab reached by the arrow keys chooses it.
- [x] 2.2 E2E in the testbed: in a pane with several tabs, Tab enters on the selected tab and the next
  Tab leaves the strip; the arrow keys, Home and End move the focus; Enter chooses; the same within a
  container's inner strip; Alt with an arrow still reorders.
- [x] 2.3 Find and adapt end-to-end tests that reach a tab by pressing Tab. None did: the full suite
  passed unchanged.

## 3. Hand-over

- [x] 3.1 Say it in `docs/reference/accessibility.md` and in `llms-full.txt`: a strip is one tab stop,
  arrows and Home/End move, Enter or Space chooses.
- [x] 3.2 Run `openspec validate --all --strict`, the shell unit suite, the full testbed e2e suite,
  lint and the repository's guards including the bundle-size check; reconcile this change's artifacts.
  Testbed e2e: 354 of 354. `loom-shell` measured 920.7 kB, over its 920 kB ceiling; raised one step
  to 925 kB as the design foresaw, approved by the owner.
