> **Status:** proposed — not approved for implementation yet.

## Why

The content area is addressed by the application's own router, and a plugin author reaches it two
ways: an ordinary link or navigation, and `ctx.navigateContent`. They look interchangeable and are
not. Only the workbench's own path hands the address to a pane that already holds the content, and
only it refuses inside a pop-out window. An ordinary link opens a second copy of work the user has
parked in a split pane, and inside a pop-out it navigates the window away from the single surface it
exists to show.

That is a trap rather than a choice: the wrong one of the two is the one that looks like ordinary
framework code, the failure is invisible until a user has split a pane or popped a tab out, and no
guide can fix it because nobody reads a guide before writing a link. The workbench should behave the
same however a navigation was started, so that there is one way to navigate and not two.

The pop-out half is not a new idea. `popout-windows` already requires that a pop-out refuse
navigation that would turn it into an ordinary application window, and says it of *anything* in the
pop-out. The implementation honours it only for the workbench's own call. That is a defect against a
requirement we already publish.

## What Changes

- Navigating to content reaches it **where it already is**, whoever started the navigation: an
  ordinary link, a programmatic navigation, browser history. Today only `ctx.navigateContent` does.
- A pop-out window refuses any navigation that would take it out of the surface it shows, not only
  the one made through the workbench's own call. This closes an existing defect.
- `ctx.navigateContent` keeps its own reasons to exist — it is capability-gated, it is what a
  sandboxed plugin has, and it is the only form that reports back — but it stops being the form you
  have to know about to avoid a bug.
- No published surface changes: nothing is added to the plugin contract and nothing is removed.
- The `routing` reference page loses the paragraph that today explains which of the two to pick.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `routing`: adds the requirement that navigating to content reaches the copy that is already open,
  independent of how the navigation was started.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/tabs/open-tabs.service.ts` — the pane hand-off
  currently sits in the service's own `navigate`; it moves to where a navigation is observed.
- `platform/libs/core/shell/src/lib/regions/content/routing/` — the content routes gain the guard
  that refuses to leave a pop-out, beside the one that already waits for the workspace to settle.
- `docs/reference/routing.md` — the section naming the asymmetry between a link and
  `ctx.navigateContent` is replaced by the rule that there is none.
- `docs/building-a-distribution.md` — the sentence about navigation reaching a surface another pane
  already holds becomes true of every navigation, not only the workbench's own.
- No consumer migration: an application that behaved correctly before behaves identically, and one
  that carried the bug stops carrying it.
