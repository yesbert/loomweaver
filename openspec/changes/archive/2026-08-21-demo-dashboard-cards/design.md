## Context

The workbench draws a tab strip and pane tools around anything the content area holds, which is
right for documents and wrong for a dashboard. It also offers the exception: a surface may declare
itself chromeless and then owns the whole content area, with no strip and no tab, the way a login or
onboarding screen does.

The demo ships two product looks and a light and dark scheme, all expressed as design tokens on the
document root. Anything drawn with its own palette would sit in the page without belonging to it.

## Goals / Non-Goals

**Goals:**

- A first screen that reads as a dashboard: cards, each answering one question it states.
- Charts that follow the colour scheme and both looks without a second source of colour.

**Non-Goals:**

- Demonstrating the workspace grammar here. The quote document does it better and is one click away.
- A charting showcase. Two charts earn their place; a third would be there to have a third.
- Making the cards rearrangeable. Inside one surface that would be a grid the product maintains, and
  the platform already offers rearranging where it belongs — between surfaces.

## Decisions

**One chromeless surface, not three.** The previous shape put a pane, a strip and a toolbar around
each reading, so the eye met the furniture before the numbers. Chromeless is the platform's own
answer for a screen that is not a document, and using it is as much a demonstration as the
arrangement it replaces — it shows that a product can take the whole area when the content warrants
it.

*Alternative rejected:* keeping the three surfaces and styling the tiles. The chrome is the problem,
and it is not ours to style.

**Chart.js, with colours read from the tokens at draw time.** The charts take their colours from the
computed values of the workbench's own custom properties, and redraw when the document's theme or
look changes. That keeps one source of colour, which is what makes a chart look like part of the
product rather than an embedded widget.

*Alternative rejected:* a chart library configured with a fixed palette. It would look wrong in one
of the two looks, and wrong again in dark.

*Alternative rejected:* hand-drawn SVG. Cheaper and dependency-free, and it was the recommendation;
the owner chose a library, which also answers the question a reader of the demo will have — whether
an ordinary charting library composes into a weaver at all.

**The margin card gates itself.** A surface can declare `access` and the workbench enforces it; a
card inside a surface cannot. The card therefore reads the demo's own session and renders nothing
for an account without the accounting role. The platform's own gating stays demonstrated where it
belongs, on the margin child of the quote document, which is untouched.

## Risks / Trade-offs

**A charting dependency in the demo** → it is MIT-licensed and passes the licence gate the demo
already runs, and it is confined to the insights plugin, which is what a weaver's own dependency
would look like.

**Charts must be redrawn on a theme or look change** → the alternative is a chart that stays light
in dark mode, which is worse and immediately visible. A single observer on the document root covers
both, because both are expressed there.

**Self-gating is weaker than platform gating** → true, and it is the price of one surface. It is
called out in the card and covered by the end-to-end case that already exists for the sales account.
