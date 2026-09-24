## Context

See proposal.md for the motivation. A tab in a strip that shows titles is a flex row between a
minimum and a maximum width: an optional leading icon, the title (which truncates), the badge, and
the close control. The badge is drawn with the look-only badge class and is kept from shrinking, so
when the strip hands each tab its minimum width, all of the shortfall lands on the title. The tab's
tooltip in that strip shows the title, or the title with the preview hint; its accessible name
already carries the badge.

## Goals / Non-Goals

**Goals:**
- The title keeps its room before the badge, in every strip that shows titles.
- A badge that has narrowed can still be read, visually as well as by a screen reader.

**Non-Goals:**
- Letting a tab grow wider for its badge. The tab's width bounds stay as they are.
- Changing the icons-only strip, which already moves the badge's text into the tooltip.

## Decisions

**The badge shrinks first, down to its padding.** The badge becomes shrinkable with a far larger
shrink weight than the title and no minimum content width, and its text sits in its own element that
cuts with an ellipsis. Flex shrinking is weighted, so the badge absorbs the shortfall until only its
padding is left, a small pill in its tone, and only then does the title shorten. The pill that is
left is the "mark in its tone" the requirement names: it tells the person there is a badge, and in
which tone, without a word.
*Alternatives considered:* hiding the badge below a width, which needs the tab's width and a size
container, and a tab sized by its content cannot be one; letting the tab grow, which moves the
problem to the next tab.

**The tooltip carries the named string.** The strip already computes the name "title, badge" for the
accessible name; the tooltip in the titles strip uses the same string, with the preview hint after
it where the tab is a preview. One string for both means they cannot disagree.

## Risks / Trade-offs

- [The utility for a large shrink weight is an arbitrary value] → If the class guardrail rejects it,
  the weight goes into the shell's own stylesheet under a badge-in-tab rule instead.
- [Layout is not observable in the unit tests' DOM] → The narrowing is pinned by a testbed
  end-to-end test that measures a narrow tab in a real browser; the unit test pins the tooltip.
