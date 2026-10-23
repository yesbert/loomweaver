## Context

See proposal.md. `<lw-menu>` finds its entries among its own children by their menu item role, moves
focus among them, and opens an entry's submenu by finding the `<lw-menu>` that is that entry's
direct child. A choice inside the submenu bubbles through the entry to the outer menu, which is what
the host and a plugin listen to. The submenu is positioned fixed, so where it sits in the document
does not decide where it is drawn.

## Goals / Non-Goals

**Goals:**

- The audit passes with a submenu open, and the entry is named by its own words.
- Nothing a plugin writes and nothing a person does changes.

**Non-Goals:**

- Changing entries without a submenu. They keep their element as the menu item.

## Decisions

### The entry takes no role; its row is the menu item

When an entry holds a submenu, the entry element gets `role="none"` and draws its check, icon, label
and mark inside one row element with the menu item role. The row carries the tab stop, the focus,
`aria-disabled`, `aria-haspopup` and `aria-expanded`, and is named by its content, so it no longer
needs `aria-labelledby`. The submenu stays where the author put it, a child of the entry and now a
sibling of the row. This is the arrangement of the WAI-ARIA authoring practices' menu pattern, and a
prototype of both shapes under axe-core 4.14 confirms it: today's shape fails `label-content-name-mismatch`,
this one reports no violation.

The menu treats the row as the entry: its list of entries takes an entry's row where the entry has
one, and finding an entry's submenu looks from the row to the element that holds it. Bubbling is
unchanged, because the submenu is still inside the entry.

*Rejected: moving the open submenu out of the entry, next to the outer menu or into the body.* It
would leave the authoring form intact too, but every lookup that relies on the nesting, the click
path, the pointer path, closing from inside and the choice reaching the outer menu, would need a
link of its own, and a `menu` as a direct child of a `menu` is not an arrangement the specification
allows.

*Rejected: hiding the open submenu from what the check reads.* The entries have to stay reachable;
what is wrong is the arrangement, not the visibility.

### The entry element lays out as if it were not there

The stylesheet gives an entry with no role `display: contents`, and gives the row the look the entry
element has today, including hover, focus, current and unavailable, and the column rules for checks
and icons. The row is then laid out by the menu exactly where the entry was. The entry element with
no role is not in the accessibility tree anyway, so taking its box away costs nothing.

## Risks / Trade-offs

- [A product's own tests or styles that address `lw-menu-item[aria-expanded]` or focus the entry
  element of an entry with a submenu stop matching] → Named in the release notes. Tests that find
  entries by role and name, which is how ours and NextPA's do, keep working.
- [A browser that does not lay out `display: contents` children as expected] → The menu's own layout
  rules decide; the end-to-end submenu tests measure placement and the pointer path in Chromium.
