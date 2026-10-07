> **Status:** approved.

## Why

NextPA found in 0.17.0 (finding F-047) that the toolbar holding a surface's actions is named by the
surface's untranslated title key: a screen reader reads `customer.group.apps` as the name of the
toolbar, and NextPA's accessibility sweep over its customer interface fails on it in both languages.

The finding blames the actions toolbar for passing the title verbatim. It does pass the key, but
that is by design: the workbench words a toolbar's `label` when it draws the toolbar. The defect is
in the toolbar itself, and it reaches every toolbar, not only a surface's actions:

- **A label that changes after the toolbar is drawn is announced as written.** The element reflects
  a changed `label` straight into its accessible name and does not tell the workbench, so nothing
  words it. That is what NextPA meets: when the surface shown under a standing toolbar changes, or
  when the framework sets the label after the element is connected, the toolbar carries the raw key
  until something else happens to redraw it.
- **A toolbar does not follow a change of language.** The workbench writes the worded name back into
  `label`, so the key is gone and the next wording has only the old language's text to work with.

This is a defect against requirements the contract already states: *The shell owns the translations
of its own chrome* (i18n) and *The workbench meets WCAG 2.1 Level AA* (accessibility).

## What Changes

- **A toolbar keeps what its author wrote and is announced by what the workbench words.** The
  element gains `accessibleName`, set by the workbench; `label` stays the author's key or text. A
  change to `label` asks the workbench to word it again. Without a workbench the toolbar is
  announced by `label` as written, as before.
- **Inside an isolated surface**, a label the plugin set is kept as its name; only a toolbar without
  one takes the slot's worded title.
- **A surface's actions toolbar is given the surface's title in words**, translated unless the
  surface marks it literal, as the tab names it. NextPA's sweep reads attributes as well as names,
  and a key standing in `label` would still read as untranslated there.
- Unit tests at the toolbar host for a label that changes after the toolbar is drawn and for a
  change of language. Both fail on 0.17.1.
- Unit tests that mount a surface's actions and assert the toolbar's name for a keyed title, a
  literal title, a surface changing under a standing toolbar and a change of language. The last two
  fail on 0.17.1, the first of them with exactly NextPA's raw key.

Not taken from the finding: drawing no toolbar while the slot holds no entry. The toolbar already
hides itself while it is empty, which takes it out of what assistive technology reads, and it has to
stand ready for an entry that arrives later. With the name worded, its attribute holds words too.

No change to an existing call, option or type; `accessibleName` is a new property on the element.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The requirements named under *Why* already promise the behaviour; the change makes the
implementation keep them and pins the case that broke.

## Impact

- `platform/libs/core/shell/src/lib/elements/toolbar/lw-toolbar.element.ts`: `accessibleName`, and a
  changed `label` reaching the workbench.
- `platform/libs/core/shell/src/lib/regions/toolbar/toolbar-host.service.ts` and
  `platform/libs/core/shell/src/lib/surface-kit/surface-toolbars.ts`: the worded name goes to
  `accessibleName` instead of over `label`.
- `platform/libs/core/shell/src/lib/regions/content/actions/surface-actions.ts` and `.html`: the
  title in words.
- `platform/libs/core/shell/src/lib/regions/content/actions/surface-actions.spec.ts` and
  `platform/libs/core/shell/src/lib/regions/toolbar/toolbar-host.service.spec.ts`: the regression
  tests in the merge gate.
- `llms-full.txt`: the toolbar's `label` is worded by the workbench and followed when it changes.
- `platform/tools/checks/bundle-size-baseline.json`: the testbed's ceiling moves from 945 to 950 kB.
- NextPA finding **F-047**. Once a release carries this, NextPA's two customer-interface sweeps turn
  green.
- Behaviour change with one additive property. Ships as a patch.
