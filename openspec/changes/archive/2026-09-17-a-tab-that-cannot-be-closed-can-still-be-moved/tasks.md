## 1. The guards

- [x] 1.1 In `platform/libs/core/shell/src/lib/regions/pane/chrome/pane-tab-strip.ts`, make
  `canReorder` and `canDrag` rest on the switches and on whether the pane holds the tab, never on
  its closability; give `StripTab` and `ContentTabView` that movability and set it false for a facet
  projection, so a tab that cannot move advertises nothing.
- [x] 1.2 Leave `onTabKeydown`'s `closable` guard alone, and confirm by test that `Delete` still
  refuses an unclosable tab and a pinned one.

## 2. One band for both routes

- [x] 2.1 Key the strip's band on pinning rather than on closability, and bind `data-reorder-band`
  to it in `pane-tab-strip.html`, so a fixed tab shares the band it stands in and the pointer and
  the keyboard read one statement.
- [x] 2.2 Test that a fixed tab cannot be moved out of its band from the keyboard, the same refusal
  the pointer path gives through `sortPredicate`.

## 3. The guarantees

- [x] 3.1 Test: a tab declared unclosable is reordered within its band and dragged into another
  pane, while closing it is still refused.
- [x] 3.2 Test: with `content.close` switched off and `reorderTabs`/`moveTabs` on, tabs are still
  reordered and moved.
- [x] 3.3 Test: the remembered order carries a fixed tab, survives a restart, and places a tab the
  stored order does not know at its natural position.
- [x] 3.4 Test: with `reorderTabs` and `moveTabs` switched off, neither gesture is offered on any
  tab, fixed or not.

## 4. Hand-over

- [x] 4.1 Check `llms-full.txt`, `docs/` and the contract comments for any sentence tying movability
  to closability, and correct it where it is wrong (`WorkspaceTab`, `ContainerTab`, the workspaces
  guide, the brief).
- [x] 4.2 Run `openspec validate --all --strict`, the shell unit suite and the repository's guards,
  then reconcile this change's artifacts with what was built.
