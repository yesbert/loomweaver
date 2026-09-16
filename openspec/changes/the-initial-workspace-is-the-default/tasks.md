## 1. One answer for the default

- [x] 1.1 Add the function that returns the declared start's id, or the reserved identifier where
      none is declared, beside the declared-start lookup.
- [x] 1.2 Resolving the active workspace: the initial value, the adoption, and a stored reserved
      identifier mapped to the declared start and written back.
- [x] 1.3 `WorkspaceService`: existence, the removal fallback and the reset of every workspace use
      it; the guards against saving a baseline for or removing the reserved identifier stay.
- [x] 1.4 The baseline lookup: the reserved identifier exists and is a change candidate only while it
      is the default.
- [x] 1.5 The workspace dialog: the first row of the user's list and its count follow the default.
- [x] 1.6 JSDoc on `initial` states that the declared start is the default and that the workbench's
      own workspace is then not offered.

## 2. Tests, one per scenario

- [x] 2.1 Dialog with a declared start: no default row, the count is the saved workspaces only.
- [x] 2.2 Removing the active saved workspace with a declared start activates the declared start.
- [x] 2.3 A stored reserved identifier with a declared start resolves to the declared start, for a
      store that reads synchronously and one that reads asynchronously, and a deep link still shows
      its content.
- [x] 2.4 Without a declared start, the dialog row, the count and the removal fallback are unchanged;
      the existing workspace suites stay green.

## 3. Documentation

- [x] 3.1 `docs/distribution/workspaces.md`: the introduction and the `initial` paragraph say the
      declared start is the default and the built-in one is then not offered; the breaking effect
      on existing users is stated.
- [x] 3.2 `llms-full.txt`: the `WorkspaceDefinition` notes and the application-reset note.

## 4. Saying it is done

- [x] 4.1 `openspec validate --all --strict`, lint, the shell unit suite, the comments, api-docs and
      bundle-size checks green.
