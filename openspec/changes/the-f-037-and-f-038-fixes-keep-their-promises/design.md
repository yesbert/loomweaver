## Context

See proposal.md for the findings. The two archived changes this corrects are
`2026-09-23-a-gated-sub-address-survives-its-workspace` and `2026-09-23-a-menu-follows-its-strings`.

**The tab sync and the URL.** `OpenTabsService` reads the address from the router's `NavigationEnd`.
Its effect gives the address a tab in the address-driven pane whenever the address changes. #458 made
it also run after every replacement of the whole arrangement (`PaneTreeService.replaced`). A workspace
switch and a reset replace the arrangement and then navigate to the content the new arrangement
names; between the two the URL is still the old one, and in the browser a render can fall in between
(a lazily loaded surface), so the effect opened the old address in the new arrangement. The unit
suite did not see it because `TestBed` does not render on its own; a test that renders once right
after the switch reproduces it on main and not on 0.13.0.

**The translation library.** Transloco's `load(lang)` ends a failed load in `handleFailure`, which
loads or reuses the fallback language and emits `translationLoadSuccess` with `wasFailure`; on that
event Transloco activates the fallback itself. This happens for any failed load, including one a
newer choice or a time bound has made irrelevant, and it is outside anything a caller of `load`
controls.

**The menu.** `LwMenuElement.openAt` and `openBeside` read the menu's size and set `left`/`top`. The
menu is `position: fixed` and sizes to its content, so an old `left` near the right edge caps the
width it measures.

## Goals / Non-Goals

**Goals:**
- F-038 stays fixed; a switch, a reset, a link into claimed content, a navigation the shell starts
  itself and a preview into claimed content behave as in 0.13.0; any replacement of the arrangement
  that leaves the address where it is gives the address its tab. None of it depends on when a render
  happens.
- Every menu the workbench draws shows words once the strings are there, and stays within the window
  and beside its control after re-wording.

**Non-Goals:**
- A language switch without a moment of keys. It is what #459 attempted; see Decisions.
- A workspace switch that is undone when the navigation that caused it fails. The switch happens in
  the router guard, before the navigation commits, as in 0.13.0; if that navigation then fails, the
  address still shown gets its tab in the arrangement entered. Changing where the switch happens is a
  change of its own.
- A shared "strings changed" stream for the menus and the command palette. Two readers do not warrant
  a third abstraction.

## Decisions

**Re-sync on a replacement, but only once no navigation is running.** The effect tracks
`PaneTreeService.replaced` and the router's `currentNavigation()` signal. While a navigation runs it
does nothing, and it skips a run in which neither the address, its route and tab root, nor the
arrangement changed. Otherwise it focuses a pane that holds the addressed content, measured against
what the new arrangement's address pane shows when the arrangement was replaced and against the
previous address when it was not, and then gives the address its tab. A navigation the shell started
itself had focused against the old arrangement, so after a replacement it is focused again.

- A switch or a reset starts its navigation in the same task as the replacement, so the effect runs
  after it ends, against the address it landed on.
- The same-address reload after sign-in ends with no navigation pending and an unchanged address; the
  replacement it made (entering the claiming workspace) gets the address's tab. That is F-038.
- Adopting a signed-in person's stored arrangement replaces it without a navigation; the address gets
  its tab back.
- A preview opened into the claiming workspace is added by the opener before the navigation ends; the
  effect finds it and only refreshes it, so it stays a preview.

*Alternatives considered:*
- **Re-syncing on every replacement, unconditionally** (#458): leaks the old address during a pending
  navigation. Rejected.
- **Giving the settled address its tab from the workspace guard** (the first correction): changes the
  arrangement before the navigation is committed, adds a permanent tab where a preview was asked for,
  adds a second copy where a secondary pane already holds the content, and does nothing for a
  replacement outside the guard. Rejected.

The query for what an address pane shows moves into the pane layer (`active-content-path.ts` beside
`pane-queries.ts`), shared by the tab sync and the workspace service, so the content slice does not
import from the workspace slice. `open-tabs.service.ts` is at the 400-line limit; the Quick-Open list,
a self-contained computation, moves into `quick-open-target.ts` beside the type it produces.

**The language switch stays as released.** `LocaleService` sets its language, Transloco's and
`<html lang>` and stores the choice in one step, as in 0.13.0. Text shown through the pipe, and every
open menu, is re-worded when the strings arrive. The i18n requirement is replaced so it says exactly
that; a requirement cannot drop a scenario through a modification, so it is removed and added under a
new name.

*Alternatives considered, in the order they were tried and reviewed:*
- **Load, then switch; switch anyway on failure** (#459): Transloco has by then activated its
  fallback, so forcing the failed language shows keys.
- **Load, then switch; stay on failure and undo Transloco's fallback**: every path Transloco takes
  outside the one subscription, such as a load that fails after the time bound or after a newer
  choice, escaped it.
- **Follow Transloco and put the language back after its own fallback**: reset a product's own
  `setActiveLang` for a language the shell does not ship, and with a failing scoped bundle made
  Transloco request it again and again.
- **Follow Transloco only**: a superseded load that fails late still switches the page to the
  fallback against the latest choice, because Transloco's shared load cannot be cancelled.
- **Load without Transloco's fallback** (`fallbackLangs: []` or the loader directly): leaves the
  failed language cached as failed until another language loads, or fetches every bundle twice.
All of them fight the library's design, where activating a language is what loads it. The owner chose
the released behaviour: keys for a moment are acceptable, words in the end are what matters.

**Place a re-worded menu again after the chrome is redrawn, moved with the control.** `present` keeps
the anchor, the control and where the control was when the menu opened. After every re-wording it
waits for the next render (`afterNextRender`), so the bar around the control has taken its new words,
then places the menu again by the rule it opened with: a point anchor shifted by as much as the control
moved, a rect anchor with its edges moved as the control's edges moved. A control no longer on the
page, or hidden, leaves the menu where it last stood, placed again there so grown words keep it within
the window. `LwMenuElement` resets its position before it measures, so the width it measures is its
own and not what the old position left it. The `langChanges$` replay at subscription is skipped,
because the menu is worded before it is placed. Placement and wording move out of the menu service
into files of their own, which keeps it under the 400-line limit.

## Risks / Trade-offs

- [After a language change, text may show keys until the strings arrive] → Accepted by the owner;
  the service worker caches the bundles, so the moment is usually too short to notice, and every
  surface is re-worded when they arrive.
- [The tab sync now also runs at the end of a navigation that changed the arrangement but not the
  address] → The sync is idempotent: it finds the tab and refreshes it.
- [A workspace switch whose navigation then fails leaves the address shown with a tab in the
  workspace entered] → Named under Non-Goals; the alternative, no tab at all for the address shown,
  is what 0.13.0 does and is worse.
