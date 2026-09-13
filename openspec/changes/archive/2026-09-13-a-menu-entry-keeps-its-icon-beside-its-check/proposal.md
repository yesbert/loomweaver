> **Status:** approved.

## Why

A menu entry has one leading place. An entry that represents something on or off draws its check
there, or nothing; every other entry draws its command's icon there. So an entry cannot show both,
and a menu that offers a choice among modes, each with its own symbol, cannot also mark the one in
effect: light, dark and following the device each have an icon in the workbench, and a product that
wants the current one marked has to give up the icons, or keep the icons and leave the choice
unmarked. Native menus on every platform draw the check beside the icon.

NextPA found this building its appearance and language menus (finding F-019): the one shows the
symbols and no mark, the other the mark and no symbol.

## What Changes

- An entry that represents a state keeps the icon of the command behind it. The check is drawn in
  a place of its own, leading, and the icon follows it; where no entry in a menu carries a check,
  no space is reserved for one, and where none carries an icon, none for that, as today.
- What is announced does not change: such an entry is still a checkable item with its state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: the requirement *An entry shows the icon and shortcut of the command behind it* says the
  icon leads, and *An entry may show a state rather than only an action* says the state is shown.
  A requirement is added beside them saying the two are shown together, and where each sits.

## Impact

- `platform/libs/core/shell/src/lib/elements/menu/lw-menu.element.ts` draws an entry and gains the
  second leading place; its spec pins it.
- `platform/libs/core/shell/src/lib/menu/menu.service.ts` decides which leading places a menu
  reserves.
- `platform/libs/core/shell/src/lib/styles/theme.css` carries the leading places' layout.
- `docs/weaver/menus.md` says an entry with a check keeps its icon.
- NextPA's `loomweaver-findings.md` marks F-019 fixed once a release carries this; that happens in
  a NextPA session, not here.

No legacy source is dissolved by this change.
