## Context

The shell draws each bar as `<header>` (`shell-bar.html`), the rail as a named `<nav>`, each side
panel as an unnamed `<aside>` (`shell-panel.html`), and gives `role="main"` and `id="lw-main-content"`
to the body of the pane that carries the address (`pane-view.html`). A side panel's tab strip is
drawn by `lw-shell-sidebar-header`, which sits beside the panel in `shell-edge.html`, or in the top
row of `shell.html` when the panel's header floats. A content pane's strip and body are siblings in
`pane-view.html`, inside `lw-content-grid`. The testbed's audit runs the WCAG A and AA tags only, so
the best-practice landmark rules never ran. See proposal.md for the failure.

## Goals / Non-Goals

**Goals:**

- One banner, one content-info region, one main, named complementary regions, and every pane body a
  tab panel.
- The skip link of `the-skip-link-stays-on-the-page` keeps working without change.

**Non-Goals:**

- Moving a floating panel header out of the top row. That is a visible layout change for a
  best-practice rule; the requirement names the limit instead.
- Landmarks inside a surface. What a plugin draws in its own interior stays its own, as *What a
  plugin inherits* says.

## Decisions

**The content area is `main`, not the focused pane.** A real `<main>` element with a translated
name wraps the content grid. A landmark that follows the focus would move whenever the person clicks
another pane, and the regions list a screen reader shows would change under them. The address
pane's body keeps `id="lw-main-content"` and `tabindex="-1"`, so the skip link still lands in the
content rather than on the edge of `main`.

**Real elements rather than roles on wrappers, found during implementation.** The first cut put
`role="main"` on the grid's host and `role="complementary"` on the panel column. The audit then
reported a plugin's own `<header>` inside a surface as a second banner, because the audit scopes a
`<header>` by the elements around it, not by roles. Any distribution whose plugins use `<header>`
would have met it. A real `<main>` and real `<aside>` elements (the column beside the content, and
the drawer on a narrow viewport) keep a plugin's interior out of the workbench's landmarks.

**Every pane body is a `tabpanel`, labelled by its active tab.** Each tab gets an id derived from
its strip's id and its path; the pane body gets an id derived from the strip's id, except the
address pane's body, which keeps `lw-main-content`. The body carries `role="tabpanel"` and
`aria-labelledby` naming the active tab, and the active tab alone carries `aria-controls` naming the
body, because the others' surfaces are not drawn. The strip names a panel only where its holder
passes one, so a strip without a body of its own never points at nothing. Where no tab is drawn for
the active surface (the strip hidden, or a home tab left out), the body carries neither the role nor
the label, rather than a label that resolves to nothing. The side panel's primary body, drawn by the
panel rather than by a pane view, takes the same role from the sidebar header's strip.

**A side panel's region wraps header and panel where they sit together.** In `shell-edge.html` the
column that already holds the panel headers and panels becomes the `<aside>`, named per side ("Left
panel", "Right panel", translated), and is drawn only on a side that declares a panel. Naming by
side rather than by the active view keeps the name stable while the person switches views, which is
what a region list needs. On a narrow viewport the drawer is the `<aside>`. Where a header floats in
the top row, the strip stays in the banner; the alternative was moving the header, rejected above.

**The rows are the landmarks, the bars are groups.** The top row in `shell.html` carries
`role="banner"` while it holds a bar or a floating panel header, and the bottom bars are wrapped in
one `<footer>`; both are named ("Top bar", "Status bar", translated). The top row stays a `div` with
the role because it is also the row that lays out floating panel headers, and an empty `<header>`
would be a banner with nothing in it. `shell-bar.html` draws a `<div role="group">` named by its
dock ("Top bar", "Status bar", "Panel footer"), since a region declares no title. The alternative,
the first bar as banner and the rest as groups, makes the landmark depend on the order a
distribution declares its bars in.

**The audit runs the landmark rules.** `a11y.spec.ts` gains a case that splits the content area and
runs `landmark-no-duplicate-banner`, `landmark-no-duplicate-contentinfo`, `landmark-one-main`,
`landmark-unique` and `region`, beside the existing WCAG tags.

## Risks / Trade-offs

- [A consumer test finds the address pane's body by the `main` role] → `#lw-main-content` stays on
  it; the move is named in the release notes.
- [`region` flags something a distribution places outside the rows, such as its own overlay] → The
  audit case runs over the testbed's chrome; what a distribution adds beside the workbench is its
  own, and the requirement speaks of the workbench's regions only.
- [The toasts and the dialog outlet lie outside the landmarks] → Both are live or modal and outside
  the `region` rule's scope; the audit case confirms it.
