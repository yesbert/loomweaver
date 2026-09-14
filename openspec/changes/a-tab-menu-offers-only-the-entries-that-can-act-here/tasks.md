## 1. The context says where the tab stands

- [x] 1.1 In the tab strip, add `sole` to every tab's menu context, true when the strip holds one
      tab, and `inContent` to a view tab's, true when the strip's region is the main area's dock.
      Unit tests on the strip for both, in both states.

## 2. The entries carry their conditions

- [x] 2.1 The two split entries of the content tab menu take `sole: false`; unit test that a
      context with `sole: true` omits them and keeps the rest, and that `sole: false` offers them.
- [x] 2.2 *Open in content* and *Move to other sidebar* take `inContent: false`; unit test that a
      context with `inContent: true` omits both and keeps stacking, reset, window and hide, and that
      `inContent: false` offers all six.

## 3. Seen and said

- [x] 3.1 Testbed end-to-end: on a lone content tab the menu has no split entries and the toolbar
      splits; on a view's tab dragged into the main area the menu has no *Open in content* and no
      *Move to other sidebar*.
- [x] 3.2 `docs/weaver/menus.md` names `sole` and `inContent` among the context fields, and says
      the menu splits a tab out while the toolbar duplicates.
- [x] 3.3 `openspec validate --all --strict`, lint and the shell unit suite green.
