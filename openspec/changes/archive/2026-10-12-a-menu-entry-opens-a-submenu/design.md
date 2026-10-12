## Context

Every menu is a `<lw-menu>` of `<lw-menu-item>` children. The element owns focus, the arrow keys
and placement (`openAt`, `openBeside`), and reports a choice as `lw-menu-select` carrying the item's
`command` attribute as a key. The workbench draws its menus through `MenuService`: `open` resolves
contributed slots into rows, `openList` takes ad-hoc rows (the facade behind `ctx.ui.openMenu` keys
them by index), and `present` appends the element to the body, listens for the choice, the dismissal
and a pointer press outside, and re-words it when the strings change. A plugin that draws in an
isolated surface uses the same element there, served by the frame kit.

A toolbar already opens a slot beside an entry: the entry's slot is resolved as `opensMenu` by a
`menuOffered` source, which a menu does not pass, so in a menu an entry with only a `submenu` resolves
to nothing and is not drawn.

## Goals / Non-Goals

**Goals:**

- One submenu mechanism, in the element, so that the host's menus, ad-hoc menus and a plugin's own
  menu in a sandbox behave and look alike.
- The rule for a contributed entry is the toolbar's rule, so an entry means the same in both.
- It looks finished: a clear chevron, the open entry marked, the submenu lined up with its entry.

**Non-Goals:**

- A pointer "safe triangle". The pause before a submenu closes covers a diagonal move into it; a
  triangle is added only if that proves too short.
- Lazy submenus that resolve when opened. A slot is resolved when the menu opens, as today, which is
  also what keeps an entry whose slot is empty out of the menu.
- Binding the keys an ad-hoc shortcut names.

## Decisions

**A submenu is a `<lw-menu>` nested inside the `<lw-menu-item>` that opens it.** That is the form a
plugin writes by hand or in a template, and it needs no ids to wire. Rejected: a sibling menu linked
by `aria-controls`, which every author of a sandboxed menu would have to wire; and a mechanism in
`MenuService` alone, which a sandboxed menu would never get. The item stays the `menuitem`, takes
`aria-haspopup="menu"` and `aria-expanded`, and is named by `aria-labelledby` pointing at its own
label part, so the entries of its submenu never become part of its name. Its render keeps the nested
menu when it redraws its parts.

**Each menu acts on its own entries only.** Its entries are its direct `menuitem` children, and it
handles a key or a click only when the nearest menu around the event's target is itself. Events still
bubble, so `lw-menu-select` from any depth reaches the listener on the outermost menu, which closes
everything; a click on an entry that opens a submenu opens it and selects nothing.

**A nested menu waits to be opened.** It does not take focus when it is connected and stays `hidden`
until its entry opens it. It is placed with the existing `openBeside`: the rectangle is the parent
menu's left and right edge and the entry's top and bottom, raised by the menu's own top padding so
its first entry lines up with the entry, preferring the right side and flipping to the left by the
existing rule. The gap between the two menus is a small constant of its own, narrower than the gap
beside a control. Closing a menu closes the submenus inside it.

**Pointer timing is one pause, 150 ms, for opening and for closing.** Resting on an entry opens its
submenu after the pause; resting on a sibling closes the open submenu after the same pause; entering
the submenu cancels a pending close. Rejected: opening on enter without a pause, which flickers
submenus open while the pointer travels down a menu.

**The chevron is the workbench's `chevronDown`, turned a quarter.** Adding a `chevronRight` to the
built-in icons would take a name a plugin may have contributed itself, since what the workbench ships
cannot be displaced. It sits where a shortcut sits; an entry never has both. The open entry carries
the hover look while its submenu is open, so the path from entry to submenu stays visible.

**A contributed entry resolves its slot in a menu as in a toolbar.** `MenuService` passes a
`menuOffered` source that answers an entry's `submenu` when that slot offers an entry for the same
context, which makes the existing `leadsSomewhere` rule apply unchanged: drawn while the slot offers
something, an ordinary entry running its command while it does not. Resolution is recursive and
carries the slots already open above it, so a slot that leads back to one of them resolves to
nothing. Nested keys are the parent's key and the child's joined, because the key of an inline entry
is its index and would repeat on every level; choosing searches the tree.

**An ad-hoc entry is one of two shapes.** `UiMenuItem` becomes a union of an action (`label`, `icon`,
`shortcut`, `run`) and a submenu (`label`, `icon`, `items`), so an entry with neither, or with both, is
a compile error instead of a silent no-op. Every existing call writes an action and still compiles.
`shortcut` takes a chord in a command's vocabulary and is drawn through the same formatting; it is
shown whether or not the workbench's own shortcuts are switched off, because those keys are the
plugin's, not the workbench's.

**Arrow keys are drawn as arrows on every platform.** `ArrowUp`, `ArrowDown`, `ArrowLeft` and
`ArrowRight` get labels in the chord table; until now they fell through to their capitalised names.

**Shipped as a patch.** Every addition is optional; the one change in meaning, `submenu` being
honoured in a menu, turns an entry that was not drawn at all into one that works.

## Risks / Trade-offs

- [A menu that already contributes an entry with a `submenu` to a menu slot starts showing it] → that
  is the point of honouring it; the entry was invisible before, so nothing that worked changes.
- [Focus and hover disagree when the pointer and keyboard are used together] → the keyboard always
  wins for focus; hover only opens and closes submenus and never moves focus out of a submenu the
  keyboard is in.
- [The element grows past the file-size limit] → the submenu part moves into a file of its own.

## Migration Plan

None. Consumers opt in by writing a `submenu`, `items` or a nested `<lw-menu>`.
