## 1. Pin the defect

- [x] 1.1 `shell.spec.ts`: clicking the skip link prevents the default and focuses the element that carries the address; see it fail on the current code
- [x] 1.2 `chrome.spec.ts`: at `/entry/e-01`, Tab focuses the skip link, Enter moves the focus to `#lw-main-content`, no `load` event fires and the address is still `/entry/e-01`; see it fail on the current code
- [x] 1.3 `chrome.spec.ts`: the same with a surface holding unsaved work (the one `surface-retention.spec.ts` uses), asserting the work survives and no leave question appears

## 2. Fix

- [x] 2.1 `shell.html` / `shell.ts`: the skip link's click handler prevents the default and focuses the current `#lw-main-content` with `preventScroll`; nothing moves when no target exists
- [x] 2.2 Run 1.1 to 1.3 green, and the existing root case in `chrome.spec.ts`

## 3. Verify

- [x] 3.1 The full shell suite
- [x] 3.2 The testbed's chrome and accessibility suites in the browser
- [x] 3.3 Lint for the shell and the testbed's end-to-end project

## 4. Close

- [x] 4.1 `docs/reference/accessibility.md`: the skip link as the requirement states it
- [x] 4.2 `openspec validate --all --strict`
- [x] 4.3 Note in the PR that this closes NextPA finding F-043
