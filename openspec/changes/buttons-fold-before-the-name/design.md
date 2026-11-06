## Context

A bar folds by rank: the end slot from its highest order down, then the centre, then the start. It
measures each entry, and folds until the remaining row and the fold control fit. The product's
identity is the first entry of the top bar and shortens itself: its name and tagline truncate when
the bar gives them less room than they need.

## Decisions

- **Measure an entry at its natural width.** The bar lets the entry grow to its content for the
  moment of measuring and reads that width. A shortened entry therefore counts at full size, and
  the buttons fold first. This is generic: any entry that shortens itself is measured the same way.
- **The tagline counts as part of the identity's natural width.** The requirement speaks of the
  entry's natural width, and the identity is one entry. Buttons therefore fold before the tagline is
  cut, too. Below the narrow width the tagline and name are not drawn anyway.
- **The identity never folds.** Folding it would leave the bar with nothing but the More control and
  take the mark away, which the product identity forbids. The bar keeps it and lets it shorten once
  nothing else can fold. Only the workbench's own identity entry stays; every other entry folds as
  before, including one a plugin contributes that shortens itself.
- **The top bar may narrow below its content.** Its host was a flexible item that could not shrink
  below the width of its entries, so the bar was as wide as its content and clipped by the column.
  Folding never started. The host may now shrink, which is what the folding requirement assumed.

## Risks / Trade-offs

- **Measuring changes the entry's layout for an instant.** The change is undone before the browser
  paints, and the bar measures only after a render or a resize, so nothing flickers or loops.
- **A long tagline folds buttons early.** That is the requirement read literally. A product that
  wants its buttons visible on narrower windows shortens its tagline.
