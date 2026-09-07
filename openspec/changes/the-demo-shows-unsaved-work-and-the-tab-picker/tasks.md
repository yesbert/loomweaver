## 1. Unsaved work in the quote document

- [ ] 1.1 Give one child of the quote document a field a visitor can edit, and make that child
      implement the dirty contract the plugin SDK publishes: dirty while the edit is unsaved, a save
      that writes to session state and resolves, a discard that drops the edit.
- [ ] 1.2 Check by hand that closing the tab, resetting the workspace and switching module with
      the edit unsaved each ask *Save*, *Discard* or *Cancel*, and that a saved edit is still there
      after reopening the quote in the same session.
- [ ] 1.3 End-to-end: editing the field and closing the tab asks; *Cancel* keeps the tab and the
      edit; *Discard* closes it and the edit is gone.
- [ ] 1.4 Both languages for the field's label and its placeholder.

## 2. The New tab picker

- [ ] 2.1 Host the overview dashboard at a bare path as well, and look at it: in the picker, in the
      tree, in the address bar. If it reads as a lie beside the module tree, take it out and record
      here that the picker's bare-path rule is the finding, for a change on `content-tabs`.
- [ ] 2.2 End-to-end: the *New tab* button opens a list with at least one entry, and picking it opens
      the dashboard in that pane.

## 3. The pictures

- [ ] 3.1 Two motifs in `platform/tools/capture-screenshots.mjs`: `unsaved-changes` (edit, close the
      tab, wait for the prompt) and `tab-picker` (open the picker from the tab strip), each in light
      and dark.
- [ ] 3.2 `docs/the-workbench.md`: the prompt gets its picture under *What else comes along*, or a
      section of its own beside the others; the quick open section gets the picker beside quick
      open. `docs/concepts/retention-and-unsaved-work.md` under *The unsaved-work question*: the
      prompt.
- [ ] 3.3 Run the docs style check and the site build, and look at both pages in both themes.
