## 1. The root main area gives a view tab its menu

- [x] 1.1 In the root content area, hand the tab strip the view menu slot and the content dock as
      the region, so that a view tab there resolves to the same slot and the same context a view
      tab in a split pane of the main area resolves to.
- [x] 1.2 Unit test on the root content area: a view tab in the root strip is given the view menu
      slot with the content dock as its region, and a content tab beside it keeps the content tab
      slot; the sidebar header and the split pane are unchanged by the existing tests.

## 2. Saying it is done

- [x] 2.1 `openspec validate --all --strict`, lint and the shell unit suite green.
