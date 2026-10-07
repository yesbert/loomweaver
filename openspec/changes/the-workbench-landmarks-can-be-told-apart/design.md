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

**The content area is `main`, not the focused pane.** The content grid's host carries `role="main"`
with a translated name. A landmark that follows the focus would move whenever the person clicks
another pane, and the regions list a screen reader shows would change under them. The address
pane's body keeps `id="lw-main-content"` and `tabindex="-1"`, so the skip link still lands in the
content rather than on the edge of `main`.

**Every pane body is a `tabpanel`, labelled by its active tab.** The pane view gives its body
`role="tabpanel"` and `aria-labelledby` pointing at the active tab's id; the strip gives each tab
`aria-controls` pointing at its pane's body. One panel per pane rather than one per tab, because a
pane renders only the active tab's surface; the label follows the active tab. A pane with a single
surface and no strip (the address pane header) labels its body from that header's title.

**A side panel's region wraps header and panel where they sit together.** In `shell-edge.html` the
column that already holds the panel headers and panels becomes the `<aside>`, named per side ("Left
panel", "Right panel", translated). Naming by side rather than by the active view keeps the name
stable while the person switches views, which is what a region list needs. In the compact drawer the
drawer element takes the role. Where a header floats in the top row, the strip stays in the banner;
the alternative was moving the header, rejected above.

**The rows are the landmarks, the bars are groups.** The top row in `shell.html` becomes `<header>`
and the bottom bars are wrapped in one `<footer>`, both named ("Top bar", "Status bar", translated).
`shell-bar.html` draws a `<div role="group">` named by the bar's region title, or by its dock where
it has none. The alternative, the first bar as banner and the rest as groups, makes the landmark
depend on the order a distribution declares its bars in.

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
