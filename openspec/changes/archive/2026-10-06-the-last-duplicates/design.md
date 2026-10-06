## Context

The frame kit's declaration is emitted as a standalone script description and may import nothing,
so a shared type can only flow from the frame kit outward: the element may import the frame kit's
type, never the reverse. The bar item is an Angular component that takes its item as an input; the
bar already holds the resolved entries.

## Goals / Non-Goals

**Goals:**

- One owner for each of the five, with no behaviour change, proven by the existing tests and the
  end-to-end suite.

**Non-Goals:**

- A shared list component for the demo. The demo shows the pattern a product writes; hiding it in a
  component would hide what it demonstrates.

## Decisions

**Activation lives in the menu layer** beside the code that decides whether an item opens a menu, as
a function taking the item, its resolved state and what running it means. The bar passes the
command; the rail passes the command or its workspace switch. Taking a callback rather than the
command service keeps the menu layer free of a dependency it would only need for this.

**The bar item takes the resolved entry as its input** instead of the raw item; its own resolution
and the computed values derived from it go away. A component cell is never resolved, so the input is
either a resolved button or a cell holding only its item.

**The toolbar entry is pinned to the slot entry rather than derived from it.** The plan was an
extension of the frame kit's type through a type-only import. Measured, that import closes a slice
cycle: the frame kit already draws with the elements, so the elements may not reach back into it,
and the cycle guard refuses the pair even for a type. The frame kit's declaration must also keep the
fields in its own text. So both declarations stay, and a type test states that the toolbar entry is
the slot entry plus the context-menu flag only the page knows of, failing the build the moment a
field is added to one and not the other.

## Risks / Trade-offs

- [Two declarations of the entry remain] → They can no longer drift: the type test fails the build
  on any difference, which is what the single declaration was for.
- [The bar item's input changes shape] → It is internal to the shell; every template and test that
  sets it changes in the same commit.
