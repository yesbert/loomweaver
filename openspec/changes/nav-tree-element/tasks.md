## 1. The tree, drawn and marked

- [x] 1.1 Add the three elements beside the existing ones: a tree taking groups and items, a group
      taking items, an item carrying the address it stands for, its label and its icon. Attribute
      and property both ways, and a property set before the definition loaded still takes effect.
- [x] 1.2 Draw a group as a group, including one holding a single item, and draw an item declared
      outside every group at the top level. Nothing is promoted, merged or flattened.
- [x] 1.3 Mark the item the `current` address lies at or under, using the same comparison the
      workbench answers a plugin with. Extract that comparison so both use one implementation.
- [x] 1.4 Announce the marked item as the current one to assistive technology, not by appearance
      alone, and give the tree the role a navigation landmark carries.
- [x] 1.5 Report a chosen item as `lw-nav-select` carrying its address, and do nothing else.
- [x] 1.6 Redraw when the declaration changes while the tree is on screen: an item added, removed or
      renamed, and the `current` address moving.
- [x] 1.7 Leave room at the end of a row for whatever else the consumer put inside the item, and
      keep the label truncating rather than pushing that content off the row.
- [x] 1.8 Style it from the workbench's stylesheet with named classes and semantic tokens, matching
      what the demo's tree looks like today, and check it against both themes.
- [x] 1.9 Unit tests, one per scenario the delta states for drawing and marking, the segment cases
      included, and one proving the tree translates nothing it is given.
- [x] 1.10 Show it in the testbed and stop. Nothing below is built before it has been looked at.

## 2. Folding, and remembering it for the session

- [x] 2.1 Fold a group open and shut on the user's command, from the keyboard as well as the
      pointer, and say which state it is in where assistive technology reads it.
- [x] 2.2 Seed a group from the declaration: shut where it says so, open where it says nothing.
- [x] 2.3 Keep what the user folded beside the element rather than on the instance, keyed by the
      group's identity, so a tree drawn again after leaving the screen finds it.
- [x] 2.4 Start from the declaration again after a reload, and hold nothing that outlives the
      session.
- [x] 2.5 Unit tests, one per scenario the delta states for folding, including the tree being
      destroyed and drawn again.

## 3. Working where the workbench is not

- [x] 3.1 Make it work in a surface running isolated from the workbench, taking the current
      appearance, and register it wherever the vocabulary is registered for that case.
- [x] 3.2 Publish the tags and classes, and give them the documentation on the published contract
      that the other elements carry.
- [x] 3.3 Name it in the consumer documentation beside the elements it sits with.
- [x] 3.4 Measure the weight the element adds to the built package against the current build, and
      name the figure in the pull request.

## 4. The demo as its first consumer

- [x] 4.1 Replace the demo's own tree with the element: its template, its marking and its folding
      go, and the structure it declares stays.
- [x] 4.2 Keep the demo's end-to-end suite passing unchanged where it describes behaviour rather
      than markup, and record every place it had to change and why.
- [x] 4.3 Record anything the demo could express before and cannot now. Each is a defect in the
      element, fixed here rather than worked around there.
- [ ] 4.4 Show the demo and stop.

## 5. What it was built for

- [ ] 5.1 Build Finance on the element: six areas, one of them shut by default, one holding a single
      view, and a sidebar long enough to scroll. This is group 2 of `demo-erp-navigation`, which
      moves here so that it is written against the element rather than against what the element
      replaced.
- [ ] 5.2 End-to-end: a sidebar that scrolls still reaches its last group, and folding survives
      leaving the module and coming back.
- [ ] 5.3 Record in `demo-erp-navigation` that its open question about an area with a single child is
      answered by the declaration deciding the shape, and that task 4.1 is answered by this change.
