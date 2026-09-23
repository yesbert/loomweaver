## Context

See proposal.md for the findings. The two archived changes this corrects are
`2026-09-23-a-gated-sub-address-survives-its-workspace` and `2026-09-23-a-menu-follows-its-strings`.

**The tab sync and the URL.** `OpenTabsService` reads the address from the router's `NavigationEnd`.
Its effect gives the address a tab in the address-driven pane whenever the address changes. #458 made
it also run after every replacement of the whole arrangement (`PaneTreeService.replaced`). A workspace
switch and a reset replace the arrangement and then navigate to the content the new arrangement
names; between the two the URL is still the old one, and in the browser a render can fall in
between (a lazily loaded surface), so the effect opened the old address in the new arrangement. The
unit suite did not see it because `TestBed` does not render on its own; a test that renders once
right after the switch reproduces it on main and not on 0.13.0.

**The load.** Transloco's `load(lang)` ends a failed load in `handleFailure`. When the next fallback
language is already cached it emits `translationLoadSuccess` for the fallback with `wasFailure`, on
which Transloco itself activates the fallback, and returns `EMPTY`. The shell sets
`fallbackLang: 'en'`, and English is normally loaded, so this is the common failure path. The shell's
loader lets a failure of the host file through; only a namespace failure is absorbed.

**The menu.** `LwMenuElement.openAt` and `openBeside` read the menu's size and set `left`/`top`; they
can run again on an open menu.

## Goals / Non-Goals

**Goals:**
- F-038 stays fixed; a switch, a reset, a link into claimed content and a preview into claimed
  content behave as in 0.13.0; any replacement of the arrangement that leaves the address where it is
  gives the address its tab. None of it depends on when a render happens.
- A language switch either completes with its strings or changes nothing, and nothing is stored
  before it completes.
- A re-worded menu stays within the window and beside its control.

**Non-Goals:**
- A shared "strings changed" stream for the menus and the command palette. Two readers do not warrant
  a third abstraction.
- Scoping a plugin's menu keys to its own bundle. The key-or-literal rule is the same for every piece
  of chrome text, and its limit is stated.
- A notice to the user when a language cannot be loaded. The switcher shows the language in effect;
  development reports the failure.

## Decisions

**Re-sync on a replacement, but only once no navigation is running.** The effect tracks
`PaneTreeService.replaced` and the router's `currentNavigation()` signal. While a navigation runs it
does nothing. When none runs, a changed address takes the existing path (focus a pane that holds the
content, then give the address its tab); an unchanged address after a replacement focuses a pane of
the new arrangement that holds the content and then gives the address its tab.

- A switch or a reset starts its navigation in the same task as the replacement, so the effect runs
  only after it ends, against the address it landed on.
- The same-address reload after sign-in ends with no navigation pending and an unchanged address; the
  replacement it made (entering the claiming workspace) gets the address's tab. That is F-038.
- Adopting a signed-in person's stored arrangement replaces it without a navigation; the address gets
  its tab back.
- A preview opened into the claiming workspace is added by the opener before the navigation ends; the
  effect finds it and only refreshes it, so it stays a preview.

*Alternatives considered:*
- **Keeping the re-sync on every replacement, unconditionally** (#458): leaks the old address during a
  pending navigation. Rejected.
- **Giving the settled address its tab from the workspace guard** (the first correction): changes the
  arrangement before the navigation is committed, adds a permanent tab where a preview was asked for,
  adds a second copy where a secondary pane already holds the content, and does nothing for a
  replacement outside the guard. Rejected after the second review.

`open-tabs.service.ts` is at the 400-line limit. The Quick-Open list, a self-contained computation of
its own theme, moves into `quick-open-target.ts` beside the type it produces.

**Load, then switch or stay.** `applyLang` takes the first value of `load(lang)`, treats an empty end,
an error or ten seconds without a value as a failure, and on success switches the signal, the active
language and `<html lang>` and stores the choice in one step. On failure it puts Transloco back to the
language in effect if Transloco fell back on its own, and reports the failure in development. A value
from storage or another window that names the language already in effect is ignored, so it does not
cancel a choice still loading. The shipped switcher sets its control back to the language in effect
right after a choice, and the control follows `lang()` when the switch completes.

*Alternative considered:* switching anyway on a failed load (the rule written in the F-037 change).
Transloco has by then activated its fallback, so forcing the failed language shows keys; not forcing
it leaves `lang()`, `<html lang>` and the stored choice claiming a language the page does not show.

**Place again after wording, measuring the control again.** `present` keeps the anchor and the
control. After a re-wording that changed the menu's text it places the menu again; for a menu opened
beside a control it measures the control again. The `langChanges$` replay at subscription is skipped,
because the menu is worded before it is placed.

## Risks / Trade-offs

- [`setLang` then `lang()` in the same turn reads the old language while strings load] → Documented
  on `LocaleService`, in the brief and in the recomposing guide.
- [The tab sync now also runs at the end of a navigation that did not change the address] → The sync
  is idempotent: it finds the tab and refreshes it.
- [A replacement while a navigation runs is handled when that navigation ends, against the address
  it reached] → That is the address the user sees; a stale one is never used.
