## 1. Exclusions that lost their file

- [x] 1.1 Correct the path of the sanitisation-bypass exclusion to `regions/content/surface/iframe-surface.ts` (S6268, 1 finding)
- [x] 1.2 Correct the three palette exclusions to `commands/palette/command-palette.html` (S6819 ×4, S6842 ×2, mouse-event ×1)
- [x] 1.3 Remove the exclusion for the deleted `lw-spinner.html`
- [x] 1.4 A check that every `resourceKey` in `sonar-project.properties` matches a file; wire it into `package.json`, the merge pipeline and `docs/reference/operations.md`

## 2. Tests without an assertion

- [x] 2.1 `translations-under-the-base.spec.ts`: every `expectOne` in the file is wrapped in an explicit expectation on the request it matched (S2699 ×7)

## 3. Code findings

- [x] 3.1 One import per module in `address-pane-header.ts`, `pane-move.service.ts`, `pane-view.ts`, `stored-pane-tree.ts`, `shell-sidebar-header.ts`, `workspace-changes.ts` (S3863 ×12)
- [x] 3.2 `tab-badge.ts`: the nested ternary becomes a statement (S3358)
- [x] 3.3 `cli/src/lib/test-fixtures.ts`: no `void` operator (S3735 ×2)
- [x] 3.4 `cli/src/lib/workspace.ts`: `?` or `undefined`, not both (S4782 ×2)
- [x] 3.5 `surface-route-data.ts` and `testbed-features.ts`: drop the needless assertions (S4325 ×2)
- [x] 3.6 `e2e-switches.ts`: the direct comparison (S1940)
- [x] 3.7 `host-context-harness.ts`: the empty class (S2094)
- [x] 3.8 `active-workspace.service.ts`: the constructor only assigned the promise other services await; it becomes a field initialiser, with no change to when the read starts (S7059)

## 4. Testbed markup

- [x] 4.1 `sandbox-rpc/view.html`: the heading and the two labels carry their English text in the markup, which the script still replaces (S6850, S6853 ×2)
- [x] 4.2 `capture-dialog.html`: the rule read the word in the translation key, not in the text; the key is renamed to `whatItShows`, after `pictureAlt` drew the same finding for "picture" (S6851)
- [x] 4.3 `testbed-form-dialog.html`: exclude the mouse-event rule for the two `<lw-button>` elements, with the reason that the element handles the keyboard itself

## 5. Verify

- [x] 5.1 Lint and tests for every project, `nx package`, the repository's guards
- [x] 5.2 The full end-to-end suite
- [x] 5.3 The Sonar workflow run on the branch: the first run listed one finding, the alt key again; the second passes the gate with no violation

## 6. Close

- [x] 6.1 `openspec validate --all --strict`
