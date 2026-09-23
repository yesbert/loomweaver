## Context

See proposal.md for the motivation. Every tab the workbench draws is drawn by one component,
`PaneTabStrip` (`regions/pane/chrome/pane-tab-strip.*`), from a `StripTab`. It has two looks: one that
shows titles (the content area and a container's inner panes) and one that shows icons only (the
sidebar switcher and panel panes). A tab's accessible name is its `aria-label`, which is the title or,
for a tab with unsaved work, the `content.unsavedTab` string around it. The unsaved dot and the
close control sit outside the tab button and are hidden from assistive technology.

Labels come from two places. A surface declares its `title` and `icon`, normalised into the
contribution registry, and `retitleSurface` replaces the title in place. A content tab may carry its
own label (`OpenTabInput.title`, `icon`, `titleIsLiteral`), which is stored with the tab (`PaneTab`)
only when it is the tab's own (`ownLabel`); re-opening the tab refines it (`refineTabTitles`). Stored
panes drop a label a tab could not have carried (`withoutBorrowedLabels`).

The class contract `.lw-badge`, with `--brand`, `--success` and `--danger`, is the workbench's badge
look already; the minimized strip uses it beside a pane's label.

## Goals / Non-Goals

**Goals:**
- A badge declared on a surface, changed live, and a badge of a content tab's own, drawn after the
  title in the titles look and announced as part of the tab's name.
- One type for a badge, the same everywhere it is given.

**Non-Goals:**
- A badge in the list of tabs that do not fit, Quick-Open or the minimized strip. They name tabs in
  lists where a badge would compete with the title for little room; they can follow if asked.
- A badge on a label given through `ContainerHandle.open`. A container's child is a surface, so its
  surface badge applies; a per-instance badge for a child opened at a concrete address can follow.
- Sub-route tabs, which a plugin draws itself.
- A count. A badge is a word or an icon; a number that changes with unread items is the request the
  owner declined in F-023.

## Decisions

**One typed badge.** `TabBadge { text?: string; textIsLiteral?: boolean; icon?: string; tone?:
'neutral' | 'brand' | 'success' | 'danger' }`. The tones are the ones `.lw-badge` has; a string would
let a typo draw nothing. `textIsLiteral` follows `titleIsLiteral`, the flag every tab label already
uses, rather than guessing from the text's shape: a badge is often a single word, and a single word
looks like neither a key nor a literal. A badge with neither text nor icon is no badge.

**A surface declares it beside its title and icon; a content tab may carry its own.** The surface
badge is what NextPA needs: "Erweitert" is a child surface, and every tab that shows it should carry
the mark. A content tab's own badge serves a document marked "Draft" among others that are not; it
travels the same way the tab's own title does, given to `openContentTab`, refined by opening again,
and stored only when it is the tab's own. The tab's own badge wins over the surface's.

**A new call changes a surface's badge live: `ctx.updateSurfaceBadge(surfaceId, badge | null)`.** It
mirrors `retitleSurface`: the same registry update in place that keeps the entry, the same capability
(`contributions`), no rebuild, a no-op for an unknown id. `retitleSurface` is not widened, because the
surfaces capability says a rename reaches the name only; a badge is not the name. `null` takes the
badge away.

*Alternative considered:* a general `relabelSurface(id, { title, icon, badge })`. It would be the
better shape if the icon also had to change live, which nobody has asked for; for now it would be a
second way to rename. Not taken.

**The registry keeps the badge out of what rebuilds routes.** The contribution registry recomputes
content routes whenever its surfaces change, which resets the router's configuration. A badge change
must not do that. The badge is therefore read through a separate signal keyed by surface id, which the
strip reads, rather than by rewriting the surface entry.

**Drawn after the title, hidden from assistive technology, folded into the name.** In the titles look
the badge is a `<span class="lw-badge ...">` after the title span inside the tab button, `aria-hidden`
because the tab's `aria-label` already carries its text: `{{title}}, {{badge}}`, and the unsaved
string wraps the result. A badge with only an icon adds nothing to the name. In the icons look the
badge text is appended to the tooltip and to the name the same way.

**It crosses the sandbox as renaming does.** `updateSurfaceBadge` joins the RPC contract beside
`retitleSurface`, and a sandboxed plugin's badge input is sanitised like its title: the text a string
of bounded length, the icon a registered icon name, the tone one of the four.

## Risks / Trade-offs

- [A badge takes width from the title in a narrow strip] → The title truncates first, as it does
  today; the badge is short by nature and keeps its width.
- [The name read aloud gets longer] → Only by the badge's text, which is the point.
- [Initial bundle size] → The shell is close to its ceiling (924.3 of 925 kB); the change adds a type,
  a signal and a span. If it crosses, the ceiling is raised for a meant growth.
