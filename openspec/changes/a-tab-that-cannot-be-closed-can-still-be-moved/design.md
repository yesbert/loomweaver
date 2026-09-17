## Context

See proposal.md, *Why*. Three facts shape the fix.

`PaneTabStrip` guards both gestures with the same condition:

```ts
canReorder(tab) { return this.reorderable() && (tab.closable || tab.pinned); }
canDrag(tab)    { return this.draggable()   && (tab.closable || tab.pinned); }
```

`ContentArea` hands the strip tabs whose `closable` already has the distribution's switch folded in
(`closable: tab.closable && this.features.close()`), which is why switching closing off takes both
gestures with it.

The bands exist twice. `PaneTabStrip.bandOf` tells three apart (`pinned`, `dynamic`, `static`) and
feeds `sortPredicate`, the pointer path. The template writes only two into
`data-reorder-band` (`tab.pinned ? 'pinned' : 'dynamic'`), and that attribute is what
`Reorderable` reads for the keyboard path. Today the divergence is invisible because a `static` tab
carries no `data-reorder-id` at all.

## Goals / Non-Goals

**Goals:**

- The two gestures rest on the switches alone.
- One band statement, read by the pointer and the keyboard.
- The remembered order proven to behave with fixed tabs in it.

**Non-Goals:**

- Any way to say "this tab stays where it is". That is a separate statement, and nobody has asked
  for it. `closable: false` will not be made to mean it.
- Touching closing. The `×`, the `Delete` key and the menu entries keep their own checks, and
  `onTabKeydown` keeps `closable` in its guard, where it is right.
- Changing what a band is or how many there are.

## Decisions

### The band becomes one statement, derived in one place

`bandOf` stays the single answer and the template binds it, so `data-reorder-band` carries
`pinned`, `dynamic` or `static` exactly as the pointer path sees it.

Rejected: leaving the attribute at two values and letting the keyboard path be laxer. It would make
the same gesture behave differently by input device, which is the kind of difference nobody finds
until a user reports it.

Rejected: deriving the band inside `Reorderable` from the DOM. The directive is generic over
reorderable strips and knows nothing about tabs; the band is the strip's knowledge.

### `canDrag` and `canReorder` keep the switch, drop the closability

They become `this.reorderable()` and `this.draggable()`. Nothing replaces the closability check,
because there is nothing left for it to decide: `enterPredicate`, `sortPredicate` and the drop
handling already say what may land where.

`data-reorder-id` follows `canReorder`, so a fixed tab becomes keyboard-reorderable in the same
step and by the same condition.

### The guarantee is stated once, in `content-tabs`

Both gestures are stated there: reordering within a band is that capability's own requirement, and
the sentence added to it also settles dragging into another pane. `panes` states that moving moves
rather than copies and names no condition about closing, so it needs nothing.

### The remembered order is verified, not adjusted

`onDrop` emits `tabs.filter(canReorder)`, so fixed tabs now enter the stored order. That is what the
existing guarantee already promises for any tab, and the store forgets what is gone and places an
unknown tab naturally, so nothing needs changing. It gets a test rather than an assumption, because
the shape of the stored value changes for a distribution that upgrades.

## Risks / Trade-offs

- **A product relied on fixed tabs staying put.** A distribution whose overview tab never moved
  because it could not be dragged will find that it can be. → That is what the contract already
  promised it would be; the switches are how a product takes the gesture away, and both are
  distribution-level and documented.
- **An order stored by an older version.** It holds only the tabs that were movable then. Restoring
  it puts the unknown fixed tab at its natural position, which is the existing guarantee for any tab
  the order does not know. Covered by the scenario that already exists for it.
