## Context

`drawMenu` marks a menu `lw-menu--checks` when some row has a state and `lw-menu--leading` when some
row has an icon. Every `<lw-menu-item>` draws two hidden places, a check place and an icon place,
and those classes show them for every entry of that menu level.

## Goals / Non-Goals

**Goals:** one leading place where no entry needs two, without changing what is announced or how
a menu with both looks.

**Non-Goals:** moving the check into the icon place for an entry that has an icon too, which would
lose the symbol the requirement keeps.

## Decisions

**A third class decides it, set where the other two are.** `drawMenu` sets `lw-menu--shared` instead
of the two classes when some row has a state, some row has an icon, and no row has both. In that
mode an entry with a state shows its check place and an entry without one shows its icon place, so
every entry shows exactly one place of the same width and the names line up. Rejected: deciding it in
the element from its children, which would make a plugin's own `<lw-menu>` change its look without
being asked; a plugin that draws its own menu sets the class it wants, as it sets the other two.

**The decision is per menu level.** A submenu reserves its places from its own entries, like the two
existing classes.

## Risks / Trade-offs

- [A toggled entry that gains an icon while the menu is open] → a menu is drawn from its rows when it
  opens and re-worded, not re-laid out, so the mode holds until the next open.
