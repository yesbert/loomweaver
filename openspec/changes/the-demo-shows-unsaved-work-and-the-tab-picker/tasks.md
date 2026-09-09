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

      **Built, looked at, taken out again.** The dashboard was registered a second time at
      `overview`, and the picker then offered exactly one entry that opened it in the pane. The
      address bar read fine. The tree did not: the demo's module navigation derives the module it
      shows from the active content path, and a path under no module falls back to the Overview
      module, which has no tree. Opening the dashboard from the Sales workspace therefore emptied
      the left panel and left it under the heading of the area that was showing before.

      Two findings, and they are different in kind. **The picker's rule**: only a route hosted at a
      bare path is offered, so in a product whose navigation is a tree under modules, the picker
      can offer nothing a visitor already knows, and the one route it can offer is the one the tree
      cannot represent. Whether it should also offer routes nested under a module is a question
      about `content-tabs`, and it belongs to a change of its own. **The demo's navigation**: the
      module nav view should keep showing the module it was registered for when the active tab
      belongs to no module, instead of emptying. That is a defect in the demo, not in the platform,
      and it is what made the bare-path route look wrong here.

      Nothing of this is in the branch: `demo/src/insights/insights.plugin.ts` is untouched.
- [ ] 2.2 End-to-end: the *New tab* button opens a list with at least one entry, and picking it opens
      the dashboard in that pane.

      Not done, and not doable while 2.1 stands: there is no bare-path route to open, so the button
      opens an empty list. It waits on whichever of the two findings above is answered first.

## 3. The pictures

- [x] 3.1 Two motifs in `platform/tools/capture-screenshots.mjs`: `unsaved-changes` (edit, close the
      tab, wait for the prompt) and `tab-picker` (open the picker from the tab strip), each in light
      and dark.

      One motif, not two. `unsaved-changes` is there and has been run, in light and dark;
      `tab-picker` is left out, as the design said it would be if the route came out again.
- [x] 3.2 `docs/the-workbench.md`: the prompt gets its picture under *What else comes along*, or a
      section of its own beside the others; the quick open section gets the picker beside quick
      open. `docs/concepts/retention-and-unsaved-work.md` under *The unsaved-work question*: the
      prompt.

      A section of its own, *Closing asks, when there is something to lose*, because *What else
      comes along* opens by saying that what it lists has no picture. The bullet that described the
      prompt there is gone, since the section now says it with a picture. The quick open section is
      unchanged: there is no picker picture to put beside it.
- [x] 3.3 Run the docs style check and the site build, and look at both pages in both themes.
