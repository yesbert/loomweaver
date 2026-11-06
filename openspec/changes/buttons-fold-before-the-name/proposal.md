> **Status:** approved.

## Why

In a top bar that runs out of room, the workbench cuts the product's name while a button still sits
beside it. The specification already asks for the opposite. A bar folds what does not fit, and every
entry left in the bar is shown at its natural width; shortening does not stand in for folding. The
product's mark is the last part of its identity to give way.

Two defects stand between the requirement and the screen. The bar measures the entry that shortens
itself at the width it was shortened to, so the shortened name always appears to fit and nothing
folds. And the top bar never narrows below the width of its own entries, so its column clips it and
folding never starts at all.

## What Changes

- The bar measures every entry at its natural width, so in a bar that runs out of room the buttons
  fold before the product's name is cut.
- The product's identity never folds away. Once every other entry has folded, the name shortens and
  the mark stays in the bar.
- The top bar narrows with the column it stands in, so it folds instead of spilling past the column.
- The requirement on the folding order gains a scenario that pins the order, and the product
  identity gains one that pins the mark staying in the bar. The wording of both stays as it is.
- No published name is added, removed or renamed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shell-layout`: a scenario for "A bar folds its last entries first": the name is cut only once
  every entry that can fold has folded.
- `product-identity`: a scenario for "The product's mark is the last part of its identity to give
  way": in a bar that runs out of room the identity does not fold away.

## Impact

- The shell's bar folding and its frame. No plugin or product has to react: a product whose top
  bar was clipped by its column now sees that bar fold its last entries into the More control.
