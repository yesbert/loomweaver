## 1. The name follows the mode

- [ ] 1.1 Make the search field's accessible name a computed value driven by the mode signal already
  on the component, using the existing translation keys for the two modes rather than new wording.
- [ ] 1.2 Pass the mode's title on both `dialogs.open` calls that open the search, so the dialog
  carries an accessible name for the mode it opened in. A bare dialog uses its title only as that
  name, so nothing visible changes.
- [ ] 1.3 Leave the placeholder exactly as it is; it stays useful, it simply stops being the only
  thing that tells the two searches apart.

## 2. Pin it, because the audit cannot

- [ ] 2.1 Test: opening the search over open work presents a name describing that, and not the
  command search. Test: the command search still presents its own name.
- [ ] 2.2 Test: after typing, so that no placeholder is shown, the name still describes the open
  mode. This is the test that would have caught the defect.
- [ ] 2.3 Extend the end-to-end coverage of the two visible search entries to assert the announced
  name, not only that the right mode opened.

## 3. Close it out

- [ ] 3.1 Run the shell unit suite and `npx nx run-many --target=lint --all` in `platform/`.
- [ ] 3.2 Run the accessibility audit in the end-to-end suite over a screen with the search open in
  each mode, and confirm it still passes — this change must not trade one violation for another.
- [ ] 3.3 Run `openspec validate --all --strict` at the repo root.
