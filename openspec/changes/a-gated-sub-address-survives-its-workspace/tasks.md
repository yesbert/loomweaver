## 1. Pin the defect

- [x] 1.1 Add a case to `a-gated-address-keeps-its-sub-address.spec.ts`: gated sibling surfaces `knowledge-base`, `knowledge-base/:entryId`, `knowledge-base/tags`, a declared workspace claiming `knowledge-base` with the tab `knowledge-base` (not closable), an anonymous session, a boot at `/knowledge-base/tags`, then a sign-in; assert the address-driven pane holds and draws `knowledge-base/tags`
- [x] 1.2 The same case at `/knowledge-base/<id>`, so the parameterised sibling is covered too
- [x] 1.3 Run both and see them fail on the current code

## 2. Fix

- [x] 2.1 `PaneTreeService`: a signal that counts whole-tree replacements, incremented in `hydrate()`
- [x] 2.2 `OpenTabsService`: read that signal in the tab-sync effect in place of `hydrated()`, the first restore counting as a replacement
- [x] 2.3 Run the new cases green, then the full shell suite

## 3. Close

- [x] 3.1 `openspec validate --all --strict`
- [x] 3.2 Note in the PR that this closes NextPA finding F-038, and that the release carrying it unblocks NextPA's adoption of 0.13.x
