## 1. Exclusions that lost their file

- [ ] 1.1 Correct the path of the sanitisation-bypass exclusion to `regions/content/surface/iframe-surface.ts` (S6268, 1 finding)
- [ ] 1.2 Correct the three palette exclusions to `commands/palette/command-palette.html` (S6819 ×4, S6842 ×2, mouse-event ×1)
- [ ] 1.3 Remove the exclusion for the deleted `lw-spinner.html`
- [ ] 1.4 A check that every `resourceKey` in `sonar-project.properties` matches a file; wire it into `package.json`, the merge pipeline and `docs/reference/operations.md`

## 2. Tests without an assertion

- [ ] 2.1 `translations-under-the-base.spec.ts`: each of the seven tests carries an explicit expectation on the request `expectOne` matched (S2699 ×7)

## 3. Code findings

- [ ] 3.1 One import per module in `address-pane-header.ts`, `pane-move.service.ts`, `pane-view.ts`, `stored-pane-tree.ts`, `shell-sidebar-header.ts`, `workspace-changes.ts` (S3863 ×12)
- [ ] 3.2 `tab-badge.ts`: the nested ternary becomes a statement (S3358)
- [ ] 3.3 `cli/src/lib/test-fixtures.ts`: no `void` operator (S3735 ×2)
- [ ] 3.4 `cli/src/lib/workspace.ts`: `?` or `undefined`, not both (S4782 ×2)
- [ ] 3.5 `surface-route-data.ts` and `testbed-features.ts`: drop the needless assertions (S4325 ×2)
- [ ] 3.6 `e2e-switches.ts`: the direct comparison (S1940)
- [ ] 3.7 `host-context-harness.ts`: the empty class (S2094)
- [ ] 3.8 `active-workspace.service.ts`: read why the constructor starts an asynchronous read, then move it to the shared hydration or out of the constructor (S7059)

## 4. Testbed markup

- [ ] 4.1 `sandbox-rpc/view.html`: the heading has content, the two labels name their controls (S6850, S6853 ×2)
- [ ] 4.2 `capture-dialog.html`: the `alt` without "image" (S6851)
- [ ] 4.3 `testbed-form-dialog.html`: exclude the mouse-event rule for the two `<lw-button>` elements, with the reason that the element handles the keyboard itself

## 5. Verify

- [ ] 5.1 Lint and tests for every project, `nx package`, the repository's guards
- [ ] 5.2 The full end-to-end suite
- [ ] 5.3 Run the Sonar workflow on the branch's merge and read the summary: the gate passes, and what it still lists is worked here

## 6. Close

- [ ] 6.1 `openspec validate --all --strict`
