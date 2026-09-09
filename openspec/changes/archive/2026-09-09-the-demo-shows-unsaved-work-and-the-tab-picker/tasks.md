## 1. Unsaved work in the quote document

- [x] 1.1 Give one child of the quote document a field a visitor can edit, and make that child
      implement the dirty contract the plugin SDK publishes: dirty while the edit is unsaved, a save
      that writes to session state and resolves, a discard that drops the edit.
- [x] 1.2 Check by hand that closing the tab, resetting the workspace and switching module with
      the edit unsaved each ask *Save*, *Discard* or *Cancel*, and that a saved edit is still there
      after reopening the quote in the same session.
- [x] 1.3 End-to-end: editing the field and closing the tab asks; *Cancel* keeps the tab and the
      edit; *Discard* closes it and the edit is gone.
- [x] 1.4 Both languages for the field's label and its placeholder.

## 2. The New tab picker

- [x] 2.1 Host the overview dashboard at a bare path as well, and look at it: in the picker, in the
      tree, in the address bar. If it reads as a lie beside the module tree, take it out and record
      here that the picker's bare-path rule is the finding, for a change on `content-tabs`.

      **Built, taken out, and built again once the real cause was found.** The dashboard is
      registered a second time at `overview`, because the landing route is chromeless and a
      chromeless route is not something a pane can host. At the first look the picker offered it
      and opened it correctly, and the address read right, but the left panel emptied and kept the
      heading of the area that had been showing.

      That was not the picker's rule. It was the demo: `ModuleNavView` derived the module it draws
      from the active content path, and a path under no module fell back to the Overview module,
      which has no tree. A tree docked in one module's workspace should keep showing that module,
      because the visitor has not left it. `moduleOfPath` now says *no module* instead of guessing
      one, and the view keeps the module it was showing. The heading then reads *Sales*, the tree
      stays, and nothing in it is marked current, because nothing in it is open.

      With that fixed the bare-path route reads honestly in all three places, so it stays, and the
      picker's rule needs no change on `content-tabs`. What is left of the original suspicion is
      only a design observation, not a defect: in a product whose navigation is a tree under
      modules, the picker can offer only routes that belong to no module, so it will usually be a
      short list.
- [x] 2.2 End-to-end: the *New tab* button opens a list with at least one entry, and picking it opens
      the dashboard in that pane.

      Two tests: the picker offers the dashboard and opens it in the pane, and opening it leaves
      the module tree standing with nothing marked current. The second one pins the fix above,
      which is otherwise only visible by eye. A unit test on `ModuleNavView` pins it from the other
      side.

## 3. The pictures

- [x] 3.1 Two motifs in `platform/tools/capture-screenshots.mjs`: `unsaved-changes` (edit, close the
      tab, wait for the prompt) and `tab-picker` (open the picker from the tab strip), each in light
      and dark.

      Both are there and have been run, in light and dark.
- [x] 3.2 `docs/the-workbench.md`: the prompt gets its picture under *What else comes along*, or a
      section of its own beside the others; the quick open section gets the picker beside quick
      open. `docs/concepts/retention-and-unsaved-work.md` under *The unsaved-work question*: the
      prompt.

      A section of its own, *Closing asks, when there is something to lose*, because *What else
      comes along* opens by saying that what it lists has no picture. The bullet that described the
      prompt there is gone, since the section now says it with a picture. The picker sits beside
      quick open, in the section the two already shared.
- [x] 3.3 Run the docs style check and the site build, and look at both pages in both themes.
