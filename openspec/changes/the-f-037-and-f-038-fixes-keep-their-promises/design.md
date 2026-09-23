## Context

See proposal.md for the findings. The two archived changes this corrects are
`2026-09-23-a-gated-sub-address-survives-its-workspace` and `2026-09-23-a-menu-follows-its-strings`.

**The tab sync and the URL.** `OpenTabsService` reads the address from the router's `NavigationEnd`.
Its effect runs whenever that address, its route or its tab root changes, and gives the address a tab
in the address-driven pane. #458 added a counter that `PaneTreeService.hydrate()` increments, so the
effect also ran after every replacement of the whole arrangement. A workspace switch and a reset both
replace the arrangement and then navigate to the content the new arrangement names. Between the two
the URL is still the old one, and in the browser a render can fall in between (a lazily loaded
surface, an asynchronous guard), so the effect opened the old address as a tab in the new
arrangement. The unit suite did not see it because `TestBed` does not render on its own; a probe that
renders once in between reproduced it on main and not on 0.13.0.

**The load.** Transloco's `load(lang)` ends a failed load in `handleFailure`. When the next fallback
language is already cached it returns `EMPTY`, so the observable completes without a value or an
error. The shell sets `fallbackLang: 'en'`, and English is normally loaded, so this is the common
failure path, not a corner.

**The menu.** `LwMenuElement.openAt` and `openBeside` read the menu's size and set `left`/`top`. They
are pure placement and can run again on an open menu.

## Goals / Non-Goals

**Goals:**
- F-038 stays fixed, and a switch, a reset or a link into claimed content behaves as in 0.13.0
  otherwise, independent of when a render happens.
- A language switch always completes, and nothing is stored before it does.
- A re-worded menu is placed again.

**Non-Goals:**
- A shared "strings changed" stream for the menus and the command palette. Two readers do not
  warrant a third abstraction.
- The switcher showing a discarded choice when another window re-applies the old language exactly
  while a load is pending. It needs a second window acting within the load's time and corrects on
  the next choice; not worth a new state on `LocaleService`.

## Decisions

**Show the settled address explicitly, instead of re-syncing on every replacement.** The only path
that replaces the arrangement and keeps the address is `WorkspaceService.settle`, when it moves the
user into the workspace that claims the address being navigated to. It knows that address. After the
switch it calls a new `OpenTabsService.showAddress(path)`, which runs the same `syncActiveTab` the
effect runs, but for the given path rather than for the URL. The effect goes back to tracking the
first restore (`hydrated()`), and `PaneTreeService.replaced` is removed.

- It covers the F-038 case: the same-URL reload after sign-in settles the address, enters the
  claiming workspace, and the address gets its tab although the URL never changes.
- It covers a link into claimed content from elsewhere: the tab is the link's, not the URL's of the
  moment. When the navigation ends, the effect finds the tab already there and only refreshes it.
- A switch or reset the user asks for does not call it, so nothing runs against the old URL.

*Alternatives considered:* keeping the counter and bumping it only on the settle path, which still
syncs against whatever the URL is when the effect runs, the same race for a link from elsewhere; and
putting the tab logic into `WorkspaceService`, which would give the workspace layer knowledge of tabs
it does not have today.

`open-tabs.service.ts` is at the 400-line limit. The Quick-Open list, a self-contained computation
of its own theme, moves into `quick-open-target.ts` beside the type it produces.

**Switch when the load ends, however it ends.** `applyLang` subscribes to `load(lang)` and switches
on `complete` or `error`. `shareReplay` completes a cached load at once, so a loaded language still
switches synchronously. `setLang` stores the choice in the same step as the switch, not before;
a language applied from storage or from another window is still never written back.

**Place again after wording.** `present` keeps the anchor it opened the menu at and re-runs the same
placement after each re-wording. The `langChanges$` replay at subscription is skipped, because the
menu is worded before it is placed.

## Risks / Trade-offs

- [`setLang` then `lang()` in the same turn reads the old language while strings load] → Documented
  on `LocaleService` and in the brief; the choice becomes visible, stored and synced together.
- [`showAddress` runs inside the settling guard, before the navigation ends] → If that navigation is
  then abandoned, the claiming workspace holds a tab for an address not reached. The workspace switch
  itself already happened at that point in 0.13.0; the tab is the smaller part of the same outcome.
