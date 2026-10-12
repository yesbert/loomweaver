> **Status:** approved.

## Why

A menu cannot hold a submenu. A contributed entry's `submenu` opens a slot beside the entry in a
toolbar only and is ignored in a menu; an ad-hoc menu a plugin opens against its own content takes a
flat list; and a plugin that draws its own menu with the workbench's element cannot nest one either.
A longer menu therefore cannot be grouped. NextPA's dashboard card menu lists rename, four moves, four
sizes and remove as ten flat entries, and works around it by opening a second menu at the same point
(finding F-049).

The same finding asks for a second, smaller thing: an ad-hoc entry cannot show a keyboard shortcut,
so a plugin that handles keys for its own content (a focused card moves with the arrow keys) cannot
show them where a person looks for them. And the workbench writes arrow keys as words ("Arrowup"),
which would make such a hint unreadable.

The owner asked for submenus that look right, not only work, and approved the change on 2026-10-12.

## What Changes

- **A menu entry may open a submenu that unfolds beside it.** The entry shows that it opens one with
  a trailing chevron, is announced as opening a menu and whether it is open, and keeps its icon. The
  submenu is placed beside the entry, lined up with it, and flips to the other side where there is no
  room; it is part of the menu it opens from, so opening it closes nothing.
- **Pointer:** resting on the entry opens the submenu after a short pause, moving on to another entry
  closes it after the same pause, and moving into the submenu keeps it open. A click or tap on the
  entry opens it at once.
- **Keyboard:** ArrowRight, Enter and Space open it and move into its first entry; ArrowLeft and
  Escape close it and return to the entry; Tab closes the whole menu. Choosing an entry in a submenu
  closes every level and returns focus to where the menu was opened from.
- **Everywhere a menu is drawn:**
  - a **contributed entry's `submenu` is honoured in a menu**, by the same rule as in a toolbar: drawn
    while its slot offers an entry, and with a `command` as well, running that while the slot is
    empty;
  - an **ad-hoc entry may carry entries of its own** in place of a `run`;
  - a plugin that draws `<lw-menu>` itself **nests a `<lw-menu>` inside a `<lw-menu-item>`**.
- **An ad-hoc entry may carry a `shortcut`**: a chord in the vocabulary of a command's shortcut, drawn
  the way the platform writes keys and not announced. It is a hint; the plugin keeps handling the keys.
- **Arrow keys are drawn as arrows** (↑ ↓ ← →) wherever the workbench writes a chord, a command's
  shortcut included.
- The documentation of `MenuItem.submenu`, the ad-hoc entry type and `<lw-menu>` says what a menu
  now does.

Additive for every consumer; nothing that worked before changes. Ships as a patch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: a menu entry may open a submenu beside it, in every kind of menu, with its pointer and
  keyboard behaviour; a submenu is part of the menu it opens from, which the rule that only one menu
  is open at a time now says; an ad-hoc entry may show a shortcut, and a shortcut writes arrow keys as
  arrows.

## Impact

- `platform/libs/core/shell/src/lib/elements/menu/lw-menu.element.ts`: submenu mechanics in the
  element, so host and sandbox share them; probably cut into a submenu part to stay under the file
  size limit.
- `platform/libs/core/shell/src/lib/menu/`: resolution of a contributed entry's slot inside a menu,
  nested rows in the drawing, choosing a nested entry.
- `platform/libs/core/shell/src/lib/plugin/context/plugin-facades.ts`: nested and shortcut-bearing
  ad-hoc entries.
- `platform/libs/core/plugin-sdk/src/lib/host-ui/host-services.ts` (`UiMenuItem`) and
  `src/lib/chrome/menu.ts` (`MenuItem.submenu` JSDoc).
- `platform/libs/core/shell/src/lib/commands/keyboard/chord.ts`: arrow labels.
- `platform/libs/core/shell/src/lib/styles/theme/lw-menu.css`: the chevron and the open entry's look.
- The testbed gains a card-like menu with a submenu of moves and sizes, their icons and shortcuts.
- `llms-full.txt`, `docs/reference/design-tokens.md` and the guide that describes menus.
- NextPA finding **F-049**. After the release NextPA turns the card menu's two follow-up menus into
  submenus and shows the arrow-key hints.
