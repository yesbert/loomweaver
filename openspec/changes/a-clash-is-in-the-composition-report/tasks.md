## 1. The report finds a shortcut claimed twice

- [x] 1.1 Write a failing test: a composition where two commands declare the same shortcut is
      reported, naming both commands and saying which one the chord runs.
- [x] 1.2 Write a failing test that a composition whose shortcuts are each declared once says nothing
      about shortcuts, and still reports itself sound.
- [x] 1.3 Work the clash out in the report from the registered commands, resolving each declared
      chord the way the key handling resolves it rather than comparing the declared strings. Two
      commands can spell one chord differently, and a chord means different keys on different
      platforms.
- [x] 1.4 Make both tests pass without touching who wins a clash or the warning that already fires
      unasked.

## 2. The existing guarantees are undisturbed

- [x] 2.1 Confirm the console warning still fires on a clash, and that the later registration still
      takes the chord. Both are required by `commands`; neither is this change's to alter.
- [x] 2.2 Confirm a clash that resolves to the same chord through different spellings is found, and
      that two commands whose chords only look alike as written are not reported.

## 3. Saying it where consumers read

- [x] 3.1 The composition report is described where a distribution reads about it. Add the new kind
      of fault there, with the reason it is worth reporting: a control goes on offering a shortcut
      that runs something else.

## 4. Closing

- [x] 4.1 Run the unit suites, the end-to-end suite and the repository guards.
- [x] 4.2 Confirm the end-to-end test asserting the testbed's report finds nothing wrong is still
      green, which now also means the testbed has no clash.
- [x] 4.3 Run `openspec validate --all --strict`.
