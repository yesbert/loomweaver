## 1. Anchored placement

- [x] 1.1 Add `openBeside(rect, side)` to `LwMenuElement`: place the menu on the given side, flip to
      the opposite side when the whole menu does not fit, align along the other axis to the edge that
      keeps it on screen, and never overlap the rect. Leave `openAt` as it is.
- [x] 1.2 Cover `openBeside` in `lw-menu.element.spec.ts`: preferred side taken when it fits, flip
      when it does not, alignment flipped for a control at the bottom edge, no overlap in any case.

## 2. Opening a declared slot against a control

- [x] 2.1 Give `MenuService.open` a `MenuAnchor = { x, y } | { rect, side }` and route the rect form
      through `openBeside`; keep the point form on `openAt`.
- [x] 2.2 Track the element that opened the current menu in `MenuService` and expose it, clearing it
      on close.
- [x] 2.3 Extend `menu.service.spec.ts` for both anchor forms and for the tracked trigger being
      cleared on close, on dismiss and when a second menu opens.

## 3. The gesture declaration

- [x] 3.1 Add `menuTrigger?: 'context' | 'primary' | 'both'` to `RailItem` and `BarButtonItem` with
      JSDoc stating the default, what the primary gesture offers, and that it wins over
      `command`/`run`.
- [x] 3.2 Rename `ContextMenuDirective` to `MenuTriggerDirective` (`menu/menu-trigger.directive.ts`,
      selector `[lwMenu]`) with inputs `lwMenu`, `lwMenuOnActivate`, `lwMenuContext`, `lwMenuSide`;
      update the four templates that use it and rename its spec file.
- [x] 3.3 Wire the primary gesture in the directive: open the activation slots against the control's
      own rect, set `aria-haspopup="menu"` where an opening gesture is present, and reflect
      `aria-expanded` from the service's tracked trigger.
- [x] 3.4 Cover the directive: click opens the activation slots and not the context ones, right-click
      still opens the context ones, keyboard activation opens and Escape returns focus, and both aria
      attributes follow.

## 4. Rail and bar

- [x] 4.1 Rail: pass the item's own slot as the activation slots when `menuTrigger` opens on
      activation, keep both slots on the context gesture, and derive the side from the region's dock.
- [x] 4.2 Rail: draw an item whose purpose is its menu even though it names no command, `run` or
      workspace, and warn in development when such an item also names an action.
- [x] 4.3 Bar: the same for `BarButtonItem`, with the side derived from the bar's dock.
- [x] 4.4 Extend `shell-rail.spec.ts` and `shell-bar-item.spec.ts` / `bar-item.spec.ts` for the new
      gesture, for the item drawn without an action, and for the curation entries staying off the
      primary gesture.

## 5. The host's own menu triggers

- [x] 5.1 Give the host call sites (`pane-tab-strip`'s new-tab and overflow buttons,
      `pane-target-picker.service`, `view-instance-switcher`) the announced state, by passing their
      trigger element so `aria-haspopup` and `aria-expanded` hold there too. The palette's menu is
      left out: it is a keyboard shortcut that closes the palette before opening the menu, so there
      is no control left to announce (design.md, "The announced state").
- [x] 5.2 Pin the announced state for at least one of them in its existing spec.

## 6. Documentation and verification

- [x] 6.1 Document `menuTrigger` in `llms-full.txt` where `RailItem` and `BarButtonItem` are printed,
      including that the primary gesture offers the item's own slot alone.
- [x] 6.2 Run `npm run lint`, `npm test`, `npm run structure-check` and
      `openspec validate --all --strict`.
