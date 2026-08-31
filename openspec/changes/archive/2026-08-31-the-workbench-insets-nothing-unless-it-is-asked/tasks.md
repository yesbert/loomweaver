## 1. One place that answers the question

- [x] 1.1 Add the distribution-level default to the shell's options, beside the retention default,
      with "no inset" as its value when nothing is passed.
- [x] 1.2 Add the single resolution step that takes a surface's declaration and the distribution's
      default and answers whether this surface is inset, mirroring how retention is resolved.
- [x] 1.3 Unit-test the resolution for all four combinations: nothing declared with each default,
      and each declared value against the opposite default.

## 2. Apply it, in both places that inset today

- [x] 2.1 Have the content pane ask the resolution step instead of treating an absent declaration as
      "inset".
- [x] 2.2 Do the same for the secondary pane, and test that both agree for the same surface.
- [x] 2.3 Test that a surface's declaration holds at every mount point: its address, a split, a
      sidebar and a pop-out window.

## 3. Make the declaration two-way

- [x] 3.1 Let the sandbox boundary carry both values rather than only the one that switches the
      inset off.
- [x] 3.2 Test that a sandboxed surface can ask to be inset and can ask to be flush, and that a
      value that is neither is still refused.

## 4. Correct the published contract's prose

- [x] 4.1 Rewrite the declaration's documentation on all three declaration shapes so it describes
      the new default, including that it now works in both directions.
- [x] 4.2 Rewrite the paragraphs in the design-tokens reference and the weaver-authoring guide that
      state the old default. Correct them rather than adding a note beside them.
- [x] 4.3 Say in the release note, first, that content goes flush on upgrade and which single line
      restores the previous look. The release note is the pull request: this repository ships
      breaking changes as patch versions and announces them there.

## 5. Make the demo demonstrate both halves

- [x] 5.1 Give every demo surface that relied on the workbench's inset its own: the dashboard, the
      assistant, the quotes list and the container children of the quote document.
- [x] 5.2 Confirm the payments frame is now inset once rather than twice, without being edited, and
      that its scrollbar reaches the pane edges.
- [x] 5.3 Install the locally built platform packages into the demo so all of this can be seen
      before anything is published, and undo that before committing.

## 6. Close the loop

- [x] 6.1 Run the platform unit tests, the demo unit tests, lint on both, and the demo end-to-end
      suite.
- [x] 6.2 Look at the demo in both themes and confirm that nothing is inset that was not asked to
      be, and that nothing that asked for an inset lost it.
