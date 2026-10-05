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
a function taking the item, its resolved entry and the command service; the rail passes a callback
for its workspace switch.

**The bar item takes the resolved entry as its input** instead of the raw item; its own resolution
and the computed values derived from it go away.

**The toolbar entry is the slot entry plus what only the page needs** (whether the entry has a
context menu), declared as an extension of the frame kit's type through a type-only import.

## Risks / Trade-offs

- [The bar item's input changes shape] → It is internal to the shell; every template and test that
  sets it changes in the same commit.
