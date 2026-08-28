## 1. Settle the one open question

- [ ] 1.1 Check how the dialog outlet renders a bare dialog that carries a title: whether naming the
  container also draws a visible heading. Record the answer in the design note, since it decides
  whether the container's name comes from the call site or from a narrow addition to the outlet.

## 2. The name follows the mode

- [ ] 2.1 Make the search field's accessible name a computed value driven by the mode signal already
  on the component, using the existing translation keys for the two modes rather than new wording.
- [ ] 2.2 Give the container a name for the mode it opened in, by whichever route task 1.1 settled.
- [ ] 2.3 Leave the placeholder exactly as it is; it stays useful, it simply stops being the only
  thing that tells the two searches apart.

## 3. Pin it, because the audit cannot

- [ ] 3.1 Test: opening the search over open work presents a name describing that, and not the
  command search. Test: the command search still presents its own name.
- [ ] 3.2 Test: after typing, so that no placeholder is shown, the name still describes the open
  mode. This is the test that would have caught the defect.
- [ ] 3.3 Extend the end-to-end coverage of the two visible search entries to assert the announced
  name, not only that the right mode opened.

## 4. Close it out

- [ ] 4.1 Run the shell unit suite and `npx nx run-many --target=lint --all` in `platform/`.
- [ ] 4.2 Run the accessibility audit in the end-to-end suite over a screen with the search open in
  each mode, and confirm it still passes — this change must not trade one violation for another.
- [ ] 4.3 Run `openspec validate --all --strict` at the repo root.
