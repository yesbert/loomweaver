> **Status:** approved — approved for implementation on 2026-10-07.

## Why

Every entry a toolbar draws looks alike: an icon-only button where it has an icon, a faint text
button where it has none. A plugin cannot mark the main action of its toolbar as primary, and a
destructive entry another plugin contributes cannot read as dangerous. So a plugin that wants a
primary action keeps a hand-drawn `<lw-button variant="primary">` cell, and a cell cannot open a
slot other plugins fill, which is exactly what a "New …" action that gathers contributed sources
needs. TreeWeaver's finding #51 met both: its "New knowledge" stays a cell, and the host draws the
slot as a second, icon-only entry beside it.

The look has to be semantic. A free class or per-entry tokens would not cross into an isolated
surface, would let a contributor restyle itself in a toolbar it does not own, and would take the
contrast of the pairing out of the workbench's hands.

## What Changes

- A menu entry may name a **variant** from the vocabulary a button already has: primary, default,
  success, danger, warning, info, ghost. Where the entry is drawn in a toolbar, it is drawn the way
  a button of that variant is drawn. Without a variant it keeps today's toolbar look, so no
  existing toolbar changes.
- The variant is honoured **only in a toolbar**. In a menu it is ignored, as a nested slot already
  is.
- **Primary belongs to the slot's owner.** An entry contributed by any other plugin that asks for
  primary is drawn without a variant, and the developer is told once. Every other variant is open
  to every contributor, so a contributed delete can look dangerous.
- An entry drawn as **primary always shows its title**, with its icon before it where it has one,
  because a coloured square does not say what it does.
- An entry that shows its title **and** opens a slot shows that it opens a menu, visibly, not only
  to assistive technology.
- An **isolated surface** is told each entry's variant, already narrowed by the owner rule, and
  draws it with the same look; a sandboxed plugin can declare a variant through its channel.

Not breaking: the field is optional, and an entry without it is drawn as today. The one visible
change to existing toolbars is the menu sign on an entry that shows its title and opens a slot.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: the requirement on toolbars gains the variant, the owner rule for primary, the labelled
  primary entry and the visible menu indicator; a variant is ignored where an entry is offered in a
  menu.
- `plugin-sandbox`: the answer an isolated surface is told about a slot carries each entry's variant,
  narrowed by the owner rule.

## Impact

- `@loomweaver/plugin-sdk`: an optional `variant` on the menu entry, typed with the existing button
  variant vocabulary. Additive.
- `@loomweaver/shell`: entry resolution carries the variant and applies the owner rule; the toolbar
  element draws variants, the labelled primary entry and the menu indicator; the sandbox channel
  carries the field in and out; the surface kit's slot entry gains it.
- `@loomweaver/frame-kit`: the toolbar a sandboxed surface draws shows the variant with the same
  look.
- Documentation of toolbars and menu entries, with an example of a primary entry opening a slot.
- Dissolves no legacy source.
