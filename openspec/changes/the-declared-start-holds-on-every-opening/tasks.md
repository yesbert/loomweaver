## 1. Pin the defect

- [ ] 1.1 Add a failing test that opens the application twice against the same stored state, at an
      address that names no content, with a declared starting workspace that holds content: the
      first opening lands on the declaration, the second one lands nowhere today.
- [ ] 1.2 Extend it to a distribution whose working state cannot be read back synchronously, so the
      arrangement arrives after the active workspace is known.

## 2. Make the opening step reachable

- [ ] 2.1 Run the step that chooses the address on every opening, not only where a workspace was
      adopted.
- [ ] 2.2 Send it to the declared starting workspace, entering that workspace by the same path a
      switch uses, so what the user left in it is what is shown.
- [ ] 2.3 Wait for the arrangement to have settled before choosing the address, and do nothing if
      the address no longer names no content by then.
- [ ] 2.4 Do nothing at all where the declared workspace holds no content of its own.
- [ ] 2.5 Make 1.1 and 1.2 pass.

## 3. Leave no step in the history

- [ ] 3.1 Replace the address rather than adding to the history when the opening step navigates, on
      the first opening as on every later one.
- [ ] 3.2 Test that going back after an opening does not return to the address that named nothing.

## 4. Pin the rest of the requirement

- [ ] 4.1 Test that a later opening shows the declared workspace as it was left, not as declared.
- [ ] 4.2 Test that the workspace the user left keeps its arrangement and is one switch away.
- [ ] 4.3 Test that a declaration holding no content of its own leaves the address alone, and what
      the distribution serves at that address is shown.
- [ ] 4.4 Test that a deep link still wins and that a claimed address still decides the workspace.

## 5. Close it out

- [ ] 5.1 Check the demo end to end: its starting workspace declares no content, so a return must
      still show the surface at the bare address.
- [ ] 5.2 Say in the guide for products what an opening at an address naming no content does, and
      what a distribution declares to change it.
- [ ] 5.3 Run the shell's tests, the demo's tests and the repository's guards.
