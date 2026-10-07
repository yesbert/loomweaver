## 1. Pin the defect

- [x] 1.1 `surface-actions.spec.ts`: a keyed title names the toolbar in words, a literal one as written
- [x] 1.2 The same file: the surface changing under a standing toolbar renames it in words; see it fail on the current code with the raw key
- [x] 1.3 The same file: the name follows a change of language; see it fail on the current code
- [x] 1.4 `toolbar-host.service.spec.ts`: a label changed after the toolbar is drawn is worded and kept as written, and the name follows a change of language; see both fail on the current code

## 2. Fix

- [x] 2.1 `LwToolbarElement`: `accessibleName`, announced before `label`; a changed `label` clears it and tells the workbench
- [x] 2.2 The workbench's toolbar host and the isolated surface's toolbars set `accessibleName` instead of writing over `label`; inside the frame, a label of the plugin's own is kept
- [x] 2.3 `SurfaceActions`: the surface's title in words, translated unless it is literal
- [x] 2.4 Run 1.1 to 1.4 green

## 3. Verify

- [x] 3.1 The full shell suite and lint
- [x] 3.2 The testbed's toolbar, sandbox and accessibility suites in the browser
- [x] 3.3 The testbed's initial bundle passes 945 kB by 0.1 kB, so its ceiling moves to 950 kB

## 4. Close

- [x] 4.1 `llms-full.txt`: how a toolbar's label is worded
- [x] 4.2 `openspec validate --all --strict`
- [x] 4.3 Note in the PR that this closes NextPA finding F-047
