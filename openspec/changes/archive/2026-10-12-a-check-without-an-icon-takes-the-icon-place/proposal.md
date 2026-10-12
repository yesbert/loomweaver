> **Status:** approved.

## Why

A menu that mixes entries with a state and entries with an icon reserves two leading columns, one for
the check and one for the icon, even when no entry needs both. The tab context menu is the common
case: "Pinned" has a state and no icon, "Reveal" and "Open in New Window" have an icon and no state,
and "Close …" have neither. Their names start after two empty columns, and with "Pinned" off the
check column is empty in every row, which reads as too much margin. The owner noticed it on
2026-10-12 and chose to let the check and the icon share one place where no entry needs both.

## What Changes

- A menu reserves a separate place for the check only where some entry shows both a check and an
  icon. Otherwise an entry's check stands where the icons stand, and the names start after one
  column.
- Menus where an entry has both, such as a list to choose from with an icon on every entry, keep the
  two places they have now.
- Nothing announced changes; the check and the icon stay hidden from assistive technology.

Additive in effect, no API change; ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: the requirement that an entry with a state keeps its icon reserves a place of its own for
  the check only where some entry needs both.

## Impact

- `platform/libs/core/shell/src/lib/menu/menu-drawing.ts`: which columns a drawn menu reserves.
- `platform/libs/core/shell/src/lib/styles/theme/lw-menu.css`: the shared column.
- `platform/libs/core/shell/src/lib/menu/menu-drawing.spec.ts` and the testbed's tab menu e2e test.
- `docs/weaver/menus.md`, where it says how a menu reserves its leading places.
