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

**The workbench's language follows the library.** `LocaleService` subscribes to Transloco's
`langChanges$` and sets `lang()` and `<html lang>` from it, so they always name the language the
interface is shown in: a fallback Transloco activates on its own after a failed load, a language a
product activates through Transloco directly (the documented path for a language the shell does not
ship), and a language outside the served set alike. The service never overrides what Transloco does.

`setLang` loads the language and asks Transloco to switch only when the load's first value leaves
Transloco holding strings for that language; then it stores the choice. An empty end, an error, a
value that is really the fallback's bundle, or ten seconds without a value is a failure: nothing is
switched or stored, and development reports it. A stored value read while a choice is loading is held
back and applied only if the choice fails; read after a choice succeeded, it is ignored. A language
from another window replaces a choice still loading here, including one that names the language
already in effect, so the windows end alike. A choice that fails leaves the choice state as it was
before it, so a stored value read later cannot undo an earlier choice that loaded. The load's
subscription is registered before it can complete, so a synchronous failure that starts the load of
a held-back language leaves that load cancellable. The shipped switcher sets its control back to
`lang()` right after a choice and follows `lang()` when the switch completes.

*Alternatives considered:*
- **Switching anyway on a failed load** (the rule written in the F-037 change): Transloco has by then
  activated its fallback, so forcing the failed language shows keys; not forcing it leaves `lang()`,
  `<html lang>` and the stored choice claiming a language the page does not show.
- **Staying in the previous language and undoing Transloco's fallback** (the first correction):
  patches one subscription, so every path Transloco takes outside it, such as a load that fails after
  the ten seconds or after a newer choice, escapes it and the two disagree again. Rejected after the
  third review.
- **Putting the language back when Transloco falls back on its own** (the third correction): reset a
  product's own `setActiveLang` for a language the shell does not ship, and with a failing scoped
  bundle made Transloco request it again and again. Rejected after the fifth review. What remains is
  Transloco's own behaviour since before these fixes: a load that fails late activates the fallback,
  and the workbench then names it.
- **A fallback strategy that never falls back**: would also change what Transloco does when the
  starting language fails to load, which then shows keys. Not taken.

**Place again after the chrome is redrawn, moved with the control.** `present` keeps the anchor, the
control and where the control was when the menu opened. After every re-wording it waits for the next
render (`afterNextRender`), so the bar around the control has taken its new words, then places the
menu again by the rule it opened with: a point anchor shifted by as much as the control moved, a rect
anchor with its edges moved as the control's edges moved, so a control that grew keeps the menu at
its side. A control no longer on the page, or hidden, leaves the menu where it last stood, placed
again there so that grown words still keep it within the window. The `langChanges$` replay at subscription is skipped,
because the menu is worded before it is placed.

**The content shown before a replacement belongs to the old arrangement.** When the address changes
and the arrangement was replaced since the last run (a link into claimed content switched the
workspace), the pane that holds the new address is focused against what the new arrangement's address
pane shows, not against the address the user left. Otherwise the address the user left was carried
into the new arrangement as the dethroned pane's content. The query for what an address pane shows
moves into the pane layer (`active-content-path.ts` beside `pane-queries.ts`), shared by the tab sync
and the workspace service, so the content slice does not import from the workspace slice. The same
applies when the navigation is one the shell started itself: its own focusing ran against the old
arrangement, so the new one is focused again when a replacement happened.

## Risks / Trade-offs

- [`setLang` then `lang()` in the same turn reads the old language while strings load] → Documented
  on `LocaleService`, in the brief and in the recomposing guide.
- [The tab sync now also runs at the end of a navigation that did not change the address] → The sync
  is idempotent: it finds the tab and refreshes it.
- [A replacement while a navigation runs is handled when that navigation ends, against the address
  it reached] → That is the address the user sees; a stale one is never used.
