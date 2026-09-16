## Context

See proposal.md, *Why*. The menu service builds an `<lw-menu>` element. The heading is a `div` with
`aria-hidden="true"`, and the menu carries the name and second line as its `aria-label`. The element's
keyboard navigation and click handling work over every descendant with a `menuitem` role, and a
selection is reported with the `command` attribute of the chosen element; the service maps that key
back to the entry it resolved and runs it. Entries naming an unregistered command are dropped in
`resolve`, and `open` returns without drawing anything when no entry is left.

## Goals / Non-Goals

**Goals:**

- `MenuHeader.command?: string`, named and resolved like `MenuItem.command`.
- A heading with a registered command takes part in the element's existing navigation and selection
  without changes to `<lw-menu>` itself.
- The name is announced once, with or without a command.

**Non-Goals:**

- No inline `run` on a heading. A heading is declared on a rail or bar item, which a sandboxed plugin
  registers over the channel, so a command id is the one form that works everywhere.
- No `when` or checked state on a heading. It leads to one place; it is not a toggle.
- No chevron or other added mark. Hover and focus are the signal, as in the account menus users know.

## Decisions

**The heading becomes a menu item by role, not a new element.** With a runnable command the service
draws the same heading markup, drops `aria-hidden`, and gives it `role="menuitem"`, `tabindex="-1"`,
a `command` attribute and an `aria-label` from the command's title. `<lw-menu>` then navigates, clicks
and selects it with the code it already has, and it is first because it is first in the DOM.
Rejected: an `<lw-menu-item>` carrying the heading's picture and two lines, which would widen a
published element for a layout only the service draws.

**The selection key cannot collide with an entry.** The heading's `command` attribute is a reserved
key (`__heading`) that the service maps to the header command, so a heading and an entry naming the
same command stay distinct selections. Both run the command through `CommandService.execute` with
the menu's context, as an entry does.

**Announced by what it does.** The menu keeps `aria-label` with the name and second line; the heading
item's accessible name is the command's translated title, and its visible lines stay hidden from
assistive technology inside it. A screen reader hears "menu, Ada Rossi, ada@example.com", then
"Profile, menu item". Rejected: naming the item by the person, which repeats the name the menu was
just announced by, the very duplication the requirement exists to prevent. A command without a title
leaves the heading plain, the same as an entry with nothing to label it is not drawn.

**A command that cannot run leaves today's heading.** The service looks the command up in the same
registry `resolve` uses. Not found means the heading is drawn exactly as now.

**A menu of one leading heading opens.** `open` returns early only when there is no entry and no
leading heading. A menu that can act is drawn.

**Look.** `.lw-menu-header[role="menuitem"]` takes the entry's hover and focus background and a
pointer cursor, from the same tokens the entries use. The divider below it stays.

## Risks / Trade-offs

- [A product sets a command on the heading and also keeps a "Profile" entry] → both work; removing
  the entry is the product's choice, and the guide shows the heading alone.
- [The heading is announced by the command's title, which a sighted user never reads there] → the
  visible name and the spoken action differ on purpose; the menu's own label carries the name, so
  nothing the eye sees is missing from what the ear hears.
