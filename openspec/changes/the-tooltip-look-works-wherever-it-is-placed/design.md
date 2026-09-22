## Context

`.lw-tooltip-bubble` in `theme.css` carries two things: the look (tooltip tokens, radius, padding,
shadow, `text-xs`) and the mechanics the element needs for a bubble in the top layer (`position:
fixed`, `inset: auto`, `margin: 0`, `border: 0`, `width: max-content`, `pointer-events: none`). The
element creates the bubble as a `span` with `popover="manual"` and sets `left`, `top` and
`max-width` inline. The tooltip tokens are inverted against the surface: `#2b3542` on light,
`#e6edf3` on dark. `.lw-badge` draws a neutral chip from `surface-overlay` and `content-muted`. The
frame kit compiles the same `theme.css`, so an isolated surface has the same classes.

## Goals / Non-Goals

**Goals:**
- One public name for the tooltip look, the one that already exists.
- A neutral badge that reads well on the bubble in both appearances, with no class to remember.

**Non-Goals:**
- Rich content in `<lw-tooltip>`. The element stays text only: a tooltip is announced as a plain
  description, and the case that asked for rich content lives in a grid that places its own tooltips.
- A light "hover card". The request is the tooltip look.
- Colour dots or tag colours. They are the product's.

## Decisions

**Split by selector, not by name.** The look stays on `.lw-tooltip-bubble`. The mechanics move to
`.lw-tooltip-bubble[popover]`, which only the element's own bubble matches, since a product places its
bubble through its container and has no reason to make it a popover. Rejected: a new class for the
look (`.lw-tooltip-surface`) with the old one composing it. Two names for one appearance invite
drift, and the old name is already the one the design-token guide names as the tooltip's look.
Rejected as well: moving the mechanics into inline styles set by the element. It would scatter the
bubble's rules across CSS and script, and the suppression rule while a menu is open already targets
the class.

**`max-width` belongs to the look.** A product bubble without a limit would run the width of the
grid. The class gets the element's default of `16rem`; the element keeps overriding it inline from its
attribute.

**The badge adapts by context.** `.lw-tooltip-bubble .lw-badge` takes its background from the
tooltip's text colour at a small opacity (around 15 %) over the tooltip's background, and its text
from the tooltip's text colour. On the light appearance that is light text on a slightly lighter dark
chip; on the dark appearance dark text on a slightly darker light chip, both far above AA. The tone
modifiers are left alone: their fill and text tokens are paired for AA on their own. Rejected: a
modifier `.lw-badge--on-tooltip`. A badge placed in a bubble without it would be wrong, and nothing
would say so.

**Verification by the audit, not by arithmetic.** An end-to-end test injects a bubble holding a
neutral and a toned badge into a testbed page, in each appearance, and runs the accessibility audit's
contrast rule on it, and checks that the injected bubble stays in the flow and takes the pointer. The
existing tooltip tests pin that the element's own bubble is unchanged.

## Risks / Trade-offs

- [Someone relied on `.lw-tooltip-bubble` positioning a hand-made element] → Undocumented; the guide
  describes the class as the look. Named in the proposal as the intended change.
- [A translucent chip on an unknown background] → The chip is only defined inside the bubble, whose
  background is the tooltip token, so the result is known in both appearances; the audit test
  measures it rather than trusting the arithmetic.
- [Bundle size] → A few CSS rules; the bundle check measures script, not the stylesheet.
