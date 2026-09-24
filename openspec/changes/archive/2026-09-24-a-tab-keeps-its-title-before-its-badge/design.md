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

**The badge takes only the room the title leaves.** The badge starts from no width at all and grows
into the space the title leaves, up to its natural width, while the title keeps its natural width as
its starting point. Where the tab has room for both, the badge reaches its full width; where it does
not, the badge stops short and cuts its text with an ellipsis; only once it is down to its padding,
a small pill in its tone, does the title shrink. The pill that is left is the "mark in its tone" the
requirement names.
*Alternatives considered:* a large shrink weight on the badge, tried first, which still hands the
title a fraction of a pixel of every shortfall, enough for the browser to cut it with an ellipsis;
hiding the badge below a width, which needs a size container, and a tab sized by its content cannot
be one; letting the tab grow, which moves the problem to the next tab.

**The tooltip carries the named string.** The strip already computes the name "title, badge" for the
accessible name; the tooltip in the titles strip uses the same string, with the preview hint after
it where the tab is a preview. One string for both means they cannot disagree.

## Risks / Trade-offs

- [A tab's natural width must still count the badge] → Measured in the testbed: a tab with room
  sizes itself to title and full badge, so nothing is cut where nothing needs to be.
- [Layout is not observable in the unit tests' DOM] → The narrowing is pinned by a testbed
  end-to-end test that measures a narrow tab in a real browser; the unit test pins the tooltip.
