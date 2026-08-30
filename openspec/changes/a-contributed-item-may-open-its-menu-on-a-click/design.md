## Context

See proposal.md — Why. What the shell already has, and what it therefore does not need to grow:

- `MenuService.open` (`menu/menu.service.ts:53`) already resolves a **declared slot** against a
  context: translation, command icons, shortcuts, grouping, separators, `when` matching. Only the
  gesture and the anchor are missing.
- `MenuService.present` already restores focus to whatever was focused when the menu opened, and
  closes on Escape, on an outside pointer press and on a second menu opening.
- Rail and bar items are native `<button>`s, so the keyboard already produces a `click` on Enter and
  Space. No key handling of our own is needed to open.
- Four host call sites open anchored menus today (`pane-tab-strip.ts:174`,
  `pane-target-picker.service.ts:55`, `view-instance-switcher.ts:66`, `command-palette.ts:266`).
  All four pass a hand-computed point to `openList` and none announces the menu on its control.

Two facts that shape the work more than the finding suggested:

- `LwMenuElement.openAt` (`elements/menu/lw-menu.element.ts:116`) **clamps** into the viewport. For a
  point that is correct and specified. For a control it is wrong: clamping a point below a
  bottom-anchored rail entry pushes the menu back over the entry.
- An item with no `command`, no `run` and no `workspace` is filtered out before it is drawn
  (`regions/rail/shell-rail.ts:78`, `regions/bar/shell-bar.ts:35`). An account entry whose whole
  purpose is its menu has none of the three, so without touching those filters the new gesture would
  never be reachable.

## Goals / Non-Goals

**Goals:**

- One declaration on the item decides the gesture; the resolution path stays the one the right-click
  already uses, so nothing about entries, labels or ordering forks.
- Anchored placement that flips rather than clamps, expressed once and reusable by the four host call
  sites later.
- The announced state is fixed once, for host menus and contributed menus alike.

**Non-Goals:**

- A heading naming what the menu was opened against. That is a separate change (finding F-004).
- Converting the four host call sites to the declared-slot path. They keep `openList`; they gain only
  the announced state.
- A view tab's menu. The capability names tabs as menu carriers, but a tab's primary click selects
  the tab, and no product has asked for the other behaviour.

## Decisions

### The declaration is `menuTrigger` on the item, defaulting to the context gesture

`RailItem` and `BarButtonItem` gain `menuTrigger?: 'context' | 'primary' | 'both'`, defaulting to
`'context'`. Additive and absent means today's behaviour, so no existing composition changes.

Alternative rejected: inferring the gesture from the absence of `command`/`run`. It would make a
missing command silently change a control's behaviour, and it leaves `'both'` unexpressible.

### The primary gesture opens the item's slot alone

The rail passes two slots to the right-click today: its own `RAIL_ITEM_CONTEXT_MENU` (hide, move to
the other rail) plus the item's. The primary gesture must not offer curation entries next to an
account's "Sign out", so it resolves the item's slot only. The right-click keeps both.

### One directive wires both gestures, and is renamed for what it now does

`ContextMenuDirective` becomes `MenuTriggerDirective` (`menu/menu-trigger.directive.ts`, selector
`[lwMenu]`), with `lwMenu` for the context-gesture slots, `lwMenuOnActivate` for the slots the
primary activation opens, `lwMenuContext` and `lwMenuSide`. It owns `aria-haspopup`, `aria-expanded`
and the click handler; the components keep deciding which slots each input gets.

The directive is internal (it is not exported from the shell's public barrel; ten attribute uses
across four templates), so the rename costs nothing outside the shell. A second directive beside the
first was rejected: two directives on one control would both want `aria-expanded`.

### Anchored placement is a second form of opening, not a change to `openAt`

`LwMenuElement` gains `openBeside(rect, side)`; `openAt` keeps clamping, which is what the pointer
case is specified to do. `openBeside` places the menu on the given side of the rect, flips to the
opposite side when the whole menu does not fit, and aligns along the other axis to whichever edge
keeps it on screen — which is exactly the bottom-anchored rail case: side `right`, alignment flipped
to the entry's bottom edge, so the menu grows upward beside the entry and never covers it.

`MenuService.open` takes `MenuAnchor = { x, y } | { rect, side }` rather than gaining a second
method, so a caller states where the menu belongs and nothing else changes.

The side is the shell's, not the plugin's: the rail derives it from its dock (`right` for a
left-docked rail, `left` for a right-docked one), a bar from its dock. A plugin declaring a side
would be declaring where the host draws its own chrome.

### The announced state is set by the directive, not by the service

`aria-haspopup="menu"` is static on a control that carries an opening gesture; `aria-expanded`
follows the open menu. `MenuService` gains an `openTrigger` signal holding the element that opened
the current menu, so the directive can reflect it and drop it on close, and so the host's own call
sites can be fixed by passing their trigger element rather than by growing handlers of their own.
The directive takes a bare `lwMenuState` for a control that opens its menu by other means, which is
what those call sites use: they build their entries ad hoc and keep doing so.

Three of the four host call sites get it. The palette's is not a control that opens a menu: its menu
is a keyboard shortcut on the search field that closes the palette first, so the element that
"opened" it no longer exists and a text field announcing a popup would be a lie.

### An item may exist for its menu alone

The rail and bar filters accept an item whose `menuTrigger` opens on activation and which names a
menu slot, even with no `command`, `run` or `workspace`. Where such an item names both a menu on
activation and an action, the menu wins and `console.warn` names the ignored action in development,
consistent with how an unanswered `workspace` id is reported.

## Risks / Trade-offs

- **A distribution sets `menuTrigger: 'primary'` on an item whose slot has no entries** → nothing
  opens, and the control looks broken. This is the existing "a menu nobody contributed to does not
  open" rule; the dev-mode warning for a slot with no entries covers the diagnosis.
- **`openBeside` measures the menu before it is placed** → the element is appended to the body
  before placement today, so its size is known; the same order is kept, and placement happens in the
  same task as the append, so nothing is painted in between.
- **Renaming the directive touches four templates** → mechanical, covered by the existing directive
  spec plus template-level tests for the rail and the bar.
- **`'both'` on an item that also names a command** → the primary click opens the menu and the
  command is only reachable elsewhere. Warned in development rather than rejected, because a
  distribution may deliberately keep the command for the palette.
