## 1. The collector does not take a move for a close

- [x] 1.1 Write a failing test: a held entry whose tab left its pane and is open in another is not
      ended by the collector; closed everywhere, it is.
- [x] 1.2 For a held entry, look for its view path in every pane before treating it as closed.

## 2. The arriving place adopts the held instance

- [x] 2.1 Write a failing test: a held instance released from one key and acquired under another is
      the same instance, is not placed, and nothing new is built.
- [x] 2.2 Write a failing test: when the new place asks before the old one lets go, it builds nothing,
      and adopts the instance once the old place releases it.
- [x] 2.3 Write a failing test: once the hold is turned off, the adopted instance is placed at the new
      place.
- [x] 2.4 Hand the hold to the stash when acquiring, and adopt the entry holding that hold when no
      entry exists under the key.

## 3. Proof in the running workbench

- [x] 3.1 Rerun the sidebar move probe: after moving the held outline it is the same instance, still in
      the product's element, and releasing places it in the other sidebar.
- [x] 3.2 Rerun it without holding: the outline is rebuilt in the other sidebar as before.

## 4. Saying it where consumers read

- [x] 4.1 Say in the view state guide and the brief that moving the view keeps a held surface and
      places it where the view is once released.

## 5. Closing

- [x] 5.1 Run the unit suites and the repository guards.
- [x] 5.2 Run `openspec validate --all --strict`.
