# Tasks

Paths are under `platform/libs/core/shell/src/lib/regions/` unless they say otherwise. Every task
is done when a test that failed before the change passes.

## 0. Audit

- [x] 0.1 Bringing a surface forward: `reveal/surface-reveal.service.ts` is the only reveal path; it
  took the first dock and the first pane holding the view (`pane/tree/pane-queries.ts`
  `findLeafWithTab`). No record of which copy was current exists; `content/tabs/content-tab-state.ts`
  keeps a per-path time for quick open, which cannot tell copies of one path apart. Governed by
  surfaces, "A plugin can bring a docked surface to the front".
- [x] 0.2 A hidden tab activated: `pane/chrome/strip-overflow.directive.ts` measures and asks for a
  reveal, which the address pane header answers with `ContentTabsService.bringToFront` and a pane
  view with `PaneTreeService.bringTabToFront`; the sidebar strip does not answer it. Whether a strip
  may be reordered is `pane/chrome/pane-affordances.ts` `tabsReorderable`. Governed by content-tabs,
  "A strip too narrow to show everything stays usable".
- [x] 0.3 The address and a pane's own buttons: `pane/pane-view.ts` moves the address on a tab
  click and a press in the body (`point` and `focusPane`), and the add-tab picker callback did
  neither. The toolbar (`pane/chrome/pane-toolbar.ts`) only splits, minimises, maximises and
  closes. Governed by panes, "Exactly one pane carries the address" and "Moving the address leaves
  every surface where it is".

## 1. Bring forward the copy current most recently

- [x] 1.1 Red test: with a copy in a sidebar and one in the content area, reveal makes current the
  one current most recently, then the one in the address pane, then the first in reading order
  (`reveal/surface-reveal.service.spec.ts`, `reveal/surface-copy-recency.spec.ts`)
- [x] 1.2 Record when each copy of a view becomes and stops being current, and choose among copies
  by that record (`reveal/surface-copy-recency.ts`, started with the shell)
- [x] 1.3 End to end: a view opened in the content area as well comes forward where it was current
  last, in either order (`platform/apps/loom-testbed-e2e/src/reveal-surface.spec.ts`)
- [x] 1.4 Delta: surfaces

## 2. A strip that may not be reordered keeps its order

- [x] 2.1 Red test: a hidden tab activated on a strip that may not be reordered is scrolled into
  view and no reveal is requested (`pane/chrome/pane-tab-strip.spec.ts`)
- [x] 2.2 The overflow directive scrolls instead of asking for a reveal when the strip may not be
  reordered (`pane/chrome/strip-overflow.directive.ts`)
- [x] 2.3 End to end: with reordering switched off, a hidden tab opened again from the entry list is
  shown, the order stays as it was, and the list of open tabs marks it (`platform/apps/loom-testbed-e2e/src/content.spec.ts`)
- [x] 2.4 Delta: content-tabs

## 3. The add-tab button moves the address

- [x] 3.1 Red test: opening an item through a pane's add-tab button moves the address to that pane
  (`pane/pane-view.spec.ts`)
- [x] 3.2 The add-tab path takes the address as a tab click does (`pane/pane-view.ts`)
- [x] 3.3 End to end: beside the address-pane tests, the add-tab button moves the address and the
  maximise button does not (`platform/apps/loom-testbed-e2e/src/address-moves-nothing-else.spec.ts`)
- [x] 3.4 Delta: panes

## 4. Hand-over

- [x] 4.1 `docs/updating.md` under 0.21.0, and the guides that describe the three behaviours
- [x] 4.2 Checks: lint and tests of the shell, the guards, packaging, the production build and the
  bundle size, `openspec validate bring-forward-and-the-fixed-strip --strict`
