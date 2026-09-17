> **Status:** approved.

## Why

A product that wants a person to lay two tabs side by side by dragging one to a pane's edge, without
a split button in the pane toolbar, cannot say so. The switch for splitting takes every route at
once, so switching it off removes the drop edges with the button and leaving it on brings the button
back with the edges.

Two of the routes already have a finer handle, and the finding that asked for this did not know it:
a distribution removes the entry in the tab menu by naming it (`menu:shell.tab.splitRight`) and the
command with its shortcut and its palette row by naming that (`shell.content.splitRight`), because
hiding a contribution by its identity covers every contribution kind. The route with no handle at
all is the button the pane toolbar draws, which is chrome rather than a contribution.

So what is missing is one thing, not a matrix, and the change stays that size. Offering a second way
to remove the menu entry and the command would be exactly the duplication the platform avoids: one
door per decision.

## What Changes

- Splitting a pane to the right and splitting it downwards MAY each be declared in a finer form that
  says the capability stays and the pane toolbar's button for it is not drawn. The plain switch keeps
  its meaning exactly: switched off, every route goes.
- The finer form names only the route that has no other handle. The menu entry and the command stay
  the business of hiding a contribution by its identity, which already works.
- The written contract says the three handles together, because knowing that two of them exist is
  what the product was missing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `gesture-configuration`: the requirement that a switch takes the affordance and the gesture
  together gains the finer form — a capability that the workbench offers through a route with no
  handle of its own may have that route left out while the capability stays, and switching the
  capability off still removes every route.

## Impact

- `platform/libs/core/shell/src/lib/foundation/shell-features.ts` — `ContentFeatures.splitRight` and
  `splitDown` accept the finer form; the defaults and the declared shape stay what they are.
- `platform/libs/core/shell/src/lib/foundation/merge-shell-features.ts` and
  `platform/libs/core/shell/src/lib/features/feature-switches.service.ts` — merging a partial
  override and reading a switch at runtime carry the finer form.
- `platform/libs/core/shell/src/lib/regions/pane/pane-view.ts` and
  `platform/libs/core/shell/src/lib/regions/content/content-area.ts` — the toolbar button asks
  whether it is drawn; the drop edges, the shortcut and the menu entry keep asking what they ask
  today.
- `llms-full.txt` and `platform/libs/tooling/devkit/src/recipes/angular-distribution/readme.ts` —
  both state that a switch takes the affordance and the gesture; both gain the finer form and the
  three handles beside it.
- NextPA finding **F-027** is what this answers. Its chat distribution wants moving and full screen
  without split buttons in a two-tab application.
- No breaking change: a boolean keeps its meaning and every default is unchanged.
