## 1. The context names the pane

- [x] 1.1 In the tab strip, add `paneId` and `primary` to a content tab's menu context, from the
      strip's drag source and its address-driven flag; unit test on the strip.
- [x] 1.2 The split pane view hands its strip the tab menu slot for a content dock, and no slot
      inside a container; unit test beside the existing view-menu ones.

## 2. The entries act on the pane in the context

- [x] 2.1 The closing service takes a pane for close, close others, close to the right and close
      all; the primary pane keeps its path, a named pane computes the same sets over the pane's
      tabs, runs the unsaved-work guard at that pane's retention scope, removes through the tree and
      runs the close hook for a routable tab. The split pane view's own close uses it. Unit tests
      per operation on a non-primary pane, including that pinned and unclosable tabs stay and that
      the primary pane's tabs are untouched.
- [x] 2.2 The move service splits from a named pane; the split from the address-carrying group is
      that with the primary pane. Unit test that a split from a non-primary pane lands the sibling
      beside that pane.
- [x] 2.3 The pin toggle and the split entries route by the pane in the context; the popout entry
      needs no change. Unit tests on the tab menu: each command with `primary: false` reaches the
      pane path, with `primary: true` the group path.

## 3. Seen and said

- [x] 3.1 Testbed end-to-end: split the main area, move a second tab into the split pane, right-click
      a tab there, see the menu, choose *Close Others*, and check the split pane keeps one tab while
      the primary pane keeps all of its own.
- [x] 3.2 `docs/weaver/menus.md` names `paneId` and `primary` among the fields a content tab's
      context carries, beside the existing ones.
- [x] 3.3 `openspec validate --all --strict`, lint and the shell unit suite green.
