## Context

See proposal.md — Why. Two small surfaces, both read from the shipped package rather than the source:
the row interpolates its label and takes nothing before it, and the identity block is absent from the
packed declarations while the update badge and the version beside it are present.

## Goals / Non-Goals

**Goals:**

- Both borrowings cost a consumer nothing it does not already know: a symbol is named the way every
  other symbol is, and the identity block is placed like the two neighbours already offered.
- Nothing that exists today looks different.

**Non-Goals:**

- No new way to describe a contributed settings row. This is the primitive a distribution and a
  plugin draw with directly, not the described-row surface a plugin contributes through.
- No second identity. The block reads the identity the distribution supplied; it does not take one.

## Decisions

**The row takes a named symbol rather than projected content.** Projecting the label would let a
caller put anything in front of it and would cost every existing caller a change. A named symbol
matches what the rail entry, the bar item, the menu entry and the navigation entry already take, so
a reader who knows one knows this one.

**The symbol is decoration, not the name.** It is drawn with the row's own text colour and is hidden
from anything reading the row out, because the label is what names it. Anything else would give a row
two names, one of which a translator never sees.

**The identity block gains an override rather than a second component.** The workbench's own frame
narrows the block by viewport, which is right in a top bar and wrong in a dialog that has a width of
its own. The caller may pin the narrow form; where it says nothing, the viewport decides exactly as
before. The alternative — exporting it unchanged — was rejected because the finding's own use, an
about dialog, is precisely the case the viewport answers wrongly.

Worth recording, because the finding says otherwise: no such input existed. The finding reports that
a `compact` input is already there; it is not, the value is read from the viewport service. The
export alone would therefore not have been enough.

## Risks / Trade-offs

- **A product puts a symbol on some rows and not others, and the labels no longer line up.** → The
  row holds no space for an absent symbol, which is what the neighbouring primitives do too. A
  product that wants a column of aligned labels gives every row a symbol.
- **Publishing the identity block fixes its markup as a contract.** → It is already fixed in
  practice: the copy in a product drifts, this does not. The published form stays what the workbench
  itself draws, which is the point of lending it.
