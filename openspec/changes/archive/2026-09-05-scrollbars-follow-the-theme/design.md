## Context

See proposal.md, *Why*. What shapes the approach is one browser detail.

A scroll indicator can be styled two ways. `scrollbar-width` and `scrollbar-color` are the standard
properties, understood by Chrome, Firefox and Safari from 18.2, and they leave the platform's own
behaviour intact: on a system that overlays its indicator, it stays an overlay and simply gets
thinner and our colour. The other way is the `::-webkit-scrollbar` pseudo-element, which is older
and offers more control.

Measured on this machine, where the operating system is on its default of showing indicators only
while scrolling: the workbench's scrolling areas reserve no width at all today, because the
indicator is drawn over the content rather than beside it.

## Goals / Non-Goals

**Goals:**

- One rule for the whole workbench. The defect is not the rail's; the rail is only where it is
  easiest to see.
- The indicator stays visible as an affordance. Thin, quiet, and ours.

**Non-Goals:**

- Reaching inside an isolated plugin document. That is a document of its own and the boundary
  stands.
- A per-region indicator style. One workbench, one indicator.

## Decisions

**Only the standard properties, never the pseudo-element.** Styling `::-webkit-scrollbar` makes
Chrome and Safari abandon the overlay indicator and lay out a classic one that takes width from the
content. In a forty pixel rail that would push the icons sideways, and it would do so on exactly the
machines that today show nothing at all. `scrollbar-width: thin` with `scrollbar-color` keeps the
platform's behaviour and only restyles it, which is what we want and is also the smaller rule.

The cost of that decision is honest: on a browser too old for `scrollbar-width`, the indicator stays
the system's. That is the same appearance as today, so nothing regresses, and it repairs itself as
browsers move.

**Two tokens, not one, and not a colour per region.** A thumb and a track, because a track colour of
its own is what lets a product make the indicator disappear into its surface or stand out against
it, and a single token could not express both. They join the set in both themes like every other
token.

**The rule sits with the tokens, at the root.** Inherited, so every scrolling area of the workbench
takes it without naming itself, including areas that do not exist yet. A region that wants something
else can still override it, and none does.

**The indicator is not gated on hover, for now.** Making it transparent until the pointer is over
the area is four lines and works: measured in the testbed, the scrolling band resolves to a fully
transparent colour with the pointer away and to the token with it over. It was left out. On a system
that already hides its indicator between scrolls, which is the default on macOS, the rule does not
quieten anything and can do the opposite, because a pointer resting over the rail is the normal
state while using it. It earns its keep only where the system draws a permanent bar, and it costs
the same thing hiding it altogether would: a scrollable area no longer says it scrolls until
somebody points at it. If a permanent bar turns out to be the case that matters, the rule comes back
with `:focus-within` beside it, so scrolling from the keyboard is not left in the dark.

## Risks / Trade-offs

- A test that pins this has to read a computed style, which is the kind of test that passes for the
  wrong reason. → Pin it where it is observable: that the scrolling areas resolve the property to
  our token's value and not to `auto`, and that redefining the token changes what they resolve to,
  which is the guarantee the capability actually makes.
- Thin is a browser's idea of thin, not a pixel we choose. → Accepted. Choosing the pixel is what
  the pseudo-element would cost us, and it costs too much.
- The token set grows by two, and the token set is published. → The consumer documentation is part
  of the work rather than a follow-up.

## What it measured

In the testbed, on a rail short enough to scroll:

- Before: the scrolling band resolved `scrollbar-width` to `auto` and `scrollbar-color` to `auto`,
  which is the browser's own indicator in the operating system's grey.
- After: `thin`, and `rgba(31, 41, 51, 0.28)` over a transparent track in the light theme,
  `rgba(226, 232, 240, 0.28)` in the dark one. Redefining the token changes what it resolves to.
- The band reserves no width it did not reserve before, which is the point of avoiding the
  pseudo-element.

One thing this could not verify by picture: a browser that overlays its indicator does not paint it
into a headless capture, so the screenshots show a scrolled rail with no indicator in it. What the
change does is therefore recorded as resolved values rather than as an image, and the eye that
confirms it is a person's, in a real browser.

A second limit, found while pinning it: `scrollbar-color` inherits and `scrollbar-width` does not.
A rule on the root alone leaves every inner scrolling area at `auto`, which is exactly what the
first attempt did, and the first test passed anyway because it asked the root rather than the area
that scrolls. The width is now stated for every element, and the test asks the band.
