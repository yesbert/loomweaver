## Context

See proposal.md — Why. This follows the change that let a contributed item open its menu on
activation; that gesture is what makes the heading worth having, and this change is otherwise
independent of it.

What the shell has today: `MenuService.createMenu` builds a menu out of entries and separators, and
`LwMenuElement` navigates whatever matches `[role^="menuitem"]`. Anything that does not carry that
role is already skipped by the arrow keys, which is how separators behave.

## Goals / Non-Goals

**Goals:**

- One declaration on the item, drawn by the host, announced once.
- The heading stays outside the entry sequence by construction rather than by a rule the keyboard
  code has to remember.

**Non-Goals:**

- A menu entry that renders a component. It would turn a menu into a surface; what would be rich
  enough to want it — theme, language, inline switches — belongs in the settings sections, where the
  workbench already puts it. Menus stay command lists.
- A heading on a menu opened at the pointer, or on a menu a plugin draws inside its own surface.
- A heading whose text a command can change while the menu is open. It is read when the menu opens,
  like every other part of it.

## Decisions

### The heading is declared on the item, not passed at the opening

`RailItem` and `BarButtonItem` gain `menuHeader?: MenuHeader` with `{ title, detail?, icon?,
initials? }`, `title` and `detail` being a translation key or a literal like every other label the
items carry. The product knows the display name and the address; the host knows neither.

Alternative rejected: deriving the heading from the item's own `title` and `initials`. It would put a
heading on menus that never asked for one, and the account case wants a second line the item has no
field for.

### The heading is drawn only where the item's own slot is opened by activation

That is the case the finding names, and it is the only one where the control cannot show the name
itself. A right-click on a rail entry opens the item's slot together with the workbench's own entries
for it, and a name above "Hide" would be describing the wrong thing.

### `MenuService.open` takes options rather than a fourth and fifth parameter

`open(menuId, context, at, options?)` with `{ trigger?, header? }`. The previous change added
`trigger` positionally; a second optional element beside it would make every call site count
arguments. Internal, so the call sites move with it.

### The heading is a plain element, not a menu item

`createMenu` prepends a heading element carrying no `menuitem` role, so `LwMenuElement.items()` never
sees it and no keyboard change is needed. It is marked hidden from assistive technology, and the menu
itself takes an `aria-label` built from the title and the second line, so the name is announced once
rather than twice or not at all.

## Risks / Trade-offs

- **A long name in a narrow menu** → the heading truncates like an entry label does, and the full
  name stays in the menu's own label for assistive technology.
- **A heading declared on an item that never opens its menu by activation** → nothing is drawn. It is
  ignored rather than reported, the way an item's other unused fields are.
