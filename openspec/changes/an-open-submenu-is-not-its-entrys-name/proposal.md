> **Status:** approved.

## Why

An entry that opens a submenu holds that submenu inside it, which is also the form a plugin writes by
hand: a `<lw-menu>` inside a `<lw-menu-item>`. While the submenu is open, every entry in it is text
the opening entry shows, so the entry "Set status" shows "Set status Open Waiting Resolved" and is
named "Set status". axe-core 4.14 reports that as a WCAG 2.5.3 *Label in Name* failure, and the
testbed's audit with a submenu open fails on it; it was left open when F-055 was fixed. No name can
contain the submenu, and the nesting itself is the cause.

## What Changes

- An entry that opens a submenu is arranged the way the WAI-ARIA authoring practices arrange a
  submenu: the entry element takes no role, its row is the menu item, and the submenu stands beside
  the row inside the entry rather than inside the row. The row carries the focus, the announcement
  that it opens a menu and whether it is open, and its name is its own words.
- What a plugin writes does not change. A `<lw-menu>` inside a `<lw-menu-item>` is still that entry's
  submenu, and a choice inside it still reaches the outer menu's `lw-menu-select`.
- Pointer, keyboard, placement and the look stay as they are. An entry without a submenu is not
  touched.
- `menus` states that an open submenu is not part of its entry's name.

For something that inspects the drawn menu, such as a product's own end-to-end tests, the role, the
focus and `aria-expanded` of an entry with a submenu move from the `<lw-menu-item>` element to its
row. The release notes say so.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: an entry that opens a submenu is announced by its own words, open or closed, and its open
  submenu's entries do not count among them.

## Impact

- The shell's menu elements, which the frame kit also ships to sandboxed surfaces.
- Their stylesheet, so the row looks and behaves as an entry does today.
- Unit tests of the menu element; the testbed's submenu audit, which passes again.
