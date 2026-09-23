> **Status:** approved.

## Why

NextPA found that a menu opened before the translations have arrived shows its keys
(`customer.account.profile`) for as long as it stays open (finding F-037). The workbench paints
before the strings arrive, by design, and a menu takes its words once, when it opens. Nothing words
it again when the strings arrive or the language changes. The same gap sits in the language switch
itself: the new language is made active before its strings are there, so for a moment the whole
interface shows keys. The contract already says a language change is applied as one act, with no
partially switched state in between.

## What Changes

- **An open menu follows its strings.** Every menu the workbench draws, whether a declared menu
  slot, a menu opened from a control, its heading, or an ad-hoc menu, is worded again when a
  translation bundle arrives and when the language changes while it is open.
- **An ad-hoc menu a plugin opens takes a key or a literal**, like every other piece of chrome text.
  A label that is a key is translated and follows the strings; a literal is shown as it is, exactly
  as today. Nothing a plugin does today changes.
- **The language switch loads first, then switches.** Choosing a language, or following a language
  chosen in another window, makes it active once its strings are loaded. A load that fails still
  switches, so the choice is never lost. A language already loaded switches at once, as today.
- **The first paint does not wait for the strings.** That stays as the i18n capability states it.

No new call. `UiMenuItem.label` widens from "a literal" to "a key or a literal", which every literal
already satisfies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: a new requirement, *An open menu follows its strings*, covering every menu the workbench
  draws, and that the entries of a menu a plugin opens against its own content take a key or a
  literal.
- `i18n`: *A language change is applied everywhere at once* gains the scenario that a language whose
  strings have not arrived yet is not shown as keys in between, and the limit that a load that fails
  still switches.

## Impact

- `platform/libs/core/shell/src/lib/menu/menu.service.ts`, `menu/menu-heading.ts`: an open menu is
  worded again on a bundle arriving or a language change.
- `platform/libs/core/shell/src/lib/views/view-instance-switcher.ts`,
  `regions/pane/chrome/pane-tab-strip.ts`, `regions/content/pane-target-picker.service.ts`,
  `regions/content/pane-targets.ts`, `plugin/host-plugin-context.ts`: the ad-hoc menus hand over
  how to word an entry instead of the words themselves.
- `platform/libs/core/shell/src/lib/i18n/locale.service.ts`: the language is switched once its
  strings are loaded.
- `platform/libs/core/plugin-sdk/src/lib/plugin.ts` (JSDoc of `UiMenuItem`), `llms-full.txt`, and
  any guide that says the ad-hoc menu label is a literal.
- NextPA finding **F-037**. NextPA's `provideStringsBeforeFirstRender()` can be removed once a
  release carries this.
