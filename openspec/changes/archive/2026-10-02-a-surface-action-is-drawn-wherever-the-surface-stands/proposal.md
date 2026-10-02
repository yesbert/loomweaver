> **Status:** approved.

## Why

A surface may declare actions, and the workbench draws them only in a panel's header. The same
declaration on a content surface draws nothing anywhere, so a plugin builds a toolbar of its own for
what the header was meant to carry (TreeWeaver finding #48). An action may also name a menu slot,
and its documentation promises a right-click menu; no header wires it, and unlike a launcher entry
or a bar button an action cannot open its menu on activation. A plugin that offers a slot for others
to fill therefore has no trigger for it, and cannot tell whether the slot holds anything
(finding #47). TreeWeaver's knowledge-base plugin answered with a command-id convention and the
`automation` capability, which is the workaround this change removes the need for.

## What Changes

- **A surface's actions are drawn wherever the surface stands**: in a content pane's header as in a
  panel's, before the pane's own controls, for the surface of the active tab.
- **An action's menu opens.** Right-clicking an action that names a menu slot opens it, as its
  documentation already says. An action may also declare that activation opens the slot, with the
  same `menuTrigger` and `menuHeader` a launcher entry and a bar button carry.
- **A control that exists to open a menu is not drawn while that menu is empty**, and appears when an
  entry arrives. This holds for launcher entries, bar buttons and surface actions alike. It is what
  lets one plugin own a slot and another fill it without either reading the other.
- **BREAKING (behaviour):** a launcher entry or bar button whose only purpose is a menu that nothing
  contributes to used to be drawn and did nothing on activation; it is now absent until the menu has
  an entry.
- The guides say where actions appear and how an action opens a menu.

Not in this change: a call for a plugin to read the entries of a slot. Hiding the empty trigger is
the case the finding names, and it needs no read.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `surfaces`: adds where a surface's actions are drawn.
- `menus`: a surface's action joins the controls that may carry a menu and open it on activation; a
  control whose activation opens an empty menu is not drawn.

## Impact

- `platform/libs/core/plugin-sdk/src/lib/surfaces/view-action.ts`: `menuTrigger`, `menuHeader`; the
  JSDoc says where an action is drawn.
- `platform/libs/core/shell/src/lib/contributions/surface-normalize.ts` and
  `contribution-registry.ts`: a routable surface keeps its actions; a read of a surface's actions.
- `platform/libs/core/shell/src/lib/regions/content/actions/`: the one component every header uses.
- `platform/libs/core/shell/src/lib/regions/panel/shell-panel.*`,
  `regions/content/address-pane-header.*`, `regions/pane/pane-view.*`, `pane-view-options.ts` and
  the tab strip: draw the active surface's actions through it; the strip's unused action row and the
  `actions` field on a strip tab are removed.
- `platform/libs/core/shell/src/lib/menu/chrome-item-menu.ts`, `regions/rail/shell-rail.ts`,
  `regions/bar/shell-bar-item.ts`: the empty-menu rule.
- `docs/` guides on surfaces and menus, `llms-full.txt`, the testbed weaver for content actions
  with a menu, with end-to-end and accessibility tests.
- TreeWeaver may then drop its own toolbar buttons and the command-id convention; that is its
  adoption, not part of this change.
- No legacy source is dissolved.
