## Context

See proposal.md — Why. Three slots draw the same fallback and only one of them frames it. The menu
heading has a slot class carrying shape and surface, with the picture filling it; the rail entry and
the bar button style the picture and leave the letters unstyled. The letters' own class is also used
in two lists, where a filled circle would be too loud, so the fix cannot live on it.

## Goals / Non-Goals

**Goals:**

- One slot, one shape, whichever of the three things fills it.
- The plain letters stay available where a list needs them.

**Non-Goals:**

- No tint derived from the name. Several workbenches colour an avatar from the string behind it; it
  is a decision with contrast consequences in both themes and nobody has asked for it. A quiet
  surface reads as a slot without claiming to identify anyone.
- No change to the fallback order, to what is announced, or to what a distribution declares.

## Decisions

**The shape becomes its own class beside the picture's, rather than an addition to the letters'
class.** The letters' class is typography and is used in a workspace list and in the curation dialog,
where the same letters are a column of text rather than a stand-in for a picture. Splitting shape
from type lets one class serve both places, and the templates say which they mean by naming both.

**The size stays where it already is, at the point of use.** The picture takes its size from the slot
it is drawn in — larger in a rail, smaller in a bar — and the mark now does the same, so the two keep
each band's rhythm instead of introducing a third size.

**The surface is the one the menu heading already uses.** Copying that value rather than inventing one
means the three slots cannot drift apart, and the value is a semantic token, so it follows the theme.

## Risks / Trade-offs

- **A distribution that drew its own circle around initials now has two.** → Named in the finding and
  unavoidable if the workbench is to draw the slot at all. It is a visible change, which is why it
  ships as its own change rather than folded into something else.
- **A quiet surface is less distinctive than a tinted one.** → Deliberate for now, and reversible: the
  shape is where the decision lives, and a tint would be a change to one class.
