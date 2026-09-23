## Context

See proposal.md for the motivation. The workbench configures Transloco with an HTTP loader and does
not wait for it before painting, which the i18n capability requires. Text drawn through the Transloco
pipe or through signals that read `langChanges$` and `events$` (the command palette) follows the
strings. Menus do not: `MenuService` builds `<lw-menu>` imperatively and writes translated strings
into attributes once. `<lw-menu-item>` already observes `label` and re-renders from it, so updating the
attribute in place is enough to re-word an entry.

Every menu passes through one place, `MenuService.present`, and is torn down in one place,
`MenuService.close`. `open` (declared slots) and `openList` (ad-hoc) are the two ways in. The ad-hoc
callers today translate before handing over: the view-instance switcher, the pane tab overflow, the
pane target picker, and `ctx.ui.openMenu`, whose items carry a literal by contract.

`LocaleService.applyLang` sets its signal, calls `setActiveLang` and sets `<html lang>` at once,
before the new language is loaded.

## Goals / Non-Goals

**Goals:**
- An open menu, its heading included, is re-worded in place when a bundle arrives or the language
  changes, keeping the focused entry.
- An ad-hoc menu entry can be a key, for plugins and for the workbench's own ad-hoc menus.
- Switching the language waits for its strings, bounded by the load failing.

**Non-Goals:**
- Holding the first paint for the strings. The i18n capability deliberately paints first.
- Dialog titles and other imperative one-time translations outside menus. A dialog is opened by a
  gesture after the interface is usable, and the language switch now waits for its strings, so the
  window in which a dialog could take keys is the first moments after start only. Not asked for, and
  left until someone does.

## Decisions

**Word a menu from its sources, and re-word on the two Transloco signals.** `createMenu` and
`createListMenu` return the menu together with a `reword()` that re-applies the translation of every
entry's source to its `label` attribute and re-draws the heading's text and accessible names.
`present` subscribes to `langChanges$` and to `events$` filtered to `translationLoadSuccess`, calls
`reword()`, and `close` unsubscribes. Updating attributes rather than rebuilding the menu keeps the
elements, and with them the focus and the position.

*Alternatives considered:* rebuilding the whole menu and restoring the focus by index, which is more
code and moves the menu if its width changes twice; and `selectTranslate` per entry, which is one
subscription per entry instead of one per menu.

**An ad-hoc entry's label is a key or a literal, or a function for the workbench's own callers.**
`MenuListEntry.label` becomes `string | ((translate) => string)`. A string goes through Transloco,
which returns a literal unchanged and is silent about it by the rule *A literal is not a missing key*.
A function is for callers whose label is composed (`resolveTitle` for a tab, `paneTargetLabel`) or is a
name a person typed (a view instance), which must never be looked up as a key. `ctx.ui.openMenu`
passes the plugin's string through, which is what widens `UiMenuItem.label` to key-or-literal.

*Alternative considered:* a separate `labelKey` field. That is a second door beside the first, and
every other chrome text field already takes either in one field.

**Load, then switch.** `applyLang` subscribes to `transloco.load(lang)` and applies the signal,
`setActiveLang` and `<html lang>` together when it emits or errors. Transloco's load is cached and
replays at once for a language already loaded, so the common case stays synchronous. The choice is
still stored immediately by `setLang`, because what the user chose does not depend on the network. A
later switch that arrives while an earlier load is pending wins: only the latest requested language
is applied.

## Risks / Trade-offs

- [A person's typed name that has the shape of a key is looked up] → The workbench's own callers pass
  such names as a function, so they are never looked up. A plugin that passes a name keeps today's
  documented limit of *A literal is not a missing key*.
- [`lang()` now changes after the load, not at the call] → Only where the language is not loaded
  yet, which is what the requirement asks. Tests that set a language backed by a synchronous loader
  are unaffected.
- [A slow load delays the switch] → That delay is exactly the time keys would otherwise have been
  shown. A failed load switches anyway.
