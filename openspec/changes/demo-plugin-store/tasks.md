## 1. The tree stops drawing what is not there

- [x] 1.1 Let the navigation view read the reachable addresses from the workbench and draw an entry
      only while its address is among them, with no area drawn whose entries are all missing.
- [x] 1.2 Unit tests: an entry whose address is gone is not drawn, an area that loses its last entry
      is not drawn, and a module whose areas all fall away draws no tree.
- [ ] 1.3 Show it and stop, with payment matching still composed, so the rule is seen to change
      nothing before anything depends on it.

## 2. The catalogue, and the store the visitor reaches

- [x] 2.1 Serve a catalogue from the demo's own origin carrying payment matching as an offered entry:
      its name, what it does, who wrote it, the capabilities it asks for and its address.
- [x] 2.2 Stop composing payment matching. It arrives through the catalogue or not at all.
- [x] 2.3 Put the store in the right rail, above the account.
- [x] 2.4 Every label the demo adds for this, in both languages.
- [x] 2.5 Walk it once by hand: browse, read the detail, consent, install, and watch the area appear
      in the Finance tree without a reload. Then remove it and watch it go.

## 3. The plugin brings settings of its own

- [x] 3.1 Give payment matching a settings section with four rows: tolerance, confirm exact matches
      automatically, sort order, and the period shown.
- [x] 3.2 Make the tolerance change what the plugin draws, so a value crossing the sandbox boundary
      can be seen taking effect.
- [x] 3.3 The section's labels in both languages, inside the plugin, since the plugin owns them.
- [x] 3.4 Look at where the workbench put the section, and record whether it grouped it apart from
      the product's own settings the way the capability says it must. **It does.** The settings
      dialog lists *General*, *Permissions* and *Plugin store* under **Options**, and the plugin's
      own section under a second group headed **Community plugins**. The plugin asks for no group
      and is given none: the grouping follows from it having been installed rather than composed.

## 4. What the change touches elsewhere

- [ ] 4.1 Fix the end-to-end suite: the specs that open payment matching install it first, through
      one shared helper rather than five inline copies.
- [ ] 4.2 Accessibility check over the store: the list and its detail from the keyboard, and the
      consent dialog announced as what it is.
- [ ] 4.3 Look at the store at a small window, where a list, a detail and two rails compete for width.
