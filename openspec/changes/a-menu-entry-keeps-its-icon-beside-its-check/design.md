## Context

See proposal.md, *Why*. The menu is a custom element the host builds from resolved entries. For each
entry it sets the command, the label, the icon if the command has one, the shortcut, and for an
entry with a state a `checkbox` attribute plus `checked` when it holds. The element renders one
leading span: in checkbox mode it holds a check icon or nothing, otherwise the icon attribute. The
service adds a class on the menu when any entry has an icon or a check, and the stylesheet shows
the leading span only under that class, so a plain menu stays flush left.

The accessible side is already right: a checkbox entry is `menuitemcheckbox` with `aria-checked`,
and the leading span is hidden from assistive technology. Only the drawing conflates the two.

## Goals / Non-Goals

**Goals:**

- Check and icon drawn side by side, in that order, with the same alignment rules a native menu
  has: names line up whether or not an entry is checked.
- Nothing changes for a menu that has no checks, and nothing changes for one that has no icons.

**Non-Goals:**

- A radio group, `menuitemradio` with one context shared by several entries. The finding names it
  as the better model for a choice among modes, and it is; it is also a new concept in the
  contract, a new attribute on the element and a new role to announce. This change makes the
  check and the icon coexist, which a radio group would also need, and leaves the group for a
  change of its own.
- A trailing check. Native menus lead with it, and leading is where the element already has it.

## Decisions

**Two leading places, not one with two children.** The check gets its own span before the icon's,
each shown by its own class on the menu: one when any entry has a check, one when any entry has an
icon. Two classes rather than one because the reservation has to be independent: a menu of checks
without icons must not leave an empty icon column, and a menu of icons without checks must not
leave an empty check column, which is the case every menu today is.

**The icon stays in the icon place in checkbox mode.** Today the element ignores the icon attribute
whenever `checkbox` is set. It stops doing that; the icon place draws the icon whenever the
attribute is there, and the check place draws the check whenever `checked` is there. The two
attributes no longer know about each other.

**Width of the check place equals the icon place.** Same fixed width, so a checked and an unchecked
entry, an entry with and without an icon, all start their names at the same offset.

## Risks / Trade-offs

- A product that relied on the check replacing the icon, drawing a different leading glyph for the
  on state, now sees both. → Nothing in the contract promised the replacement, and no menu in the
  workbench or in the demo depends on it. Named in the release note by the pull request title.
- Two reserved columns make a menu with both wider by one icon width. → That is what a native menu
  looks like, and only a menu that actually has both pays it.
