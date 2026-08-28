## Context

The demo composes one domain plugin, `quotes`, and a `welcome` surface. Its accounting module —
quotes, customers, articles, totals, margin and a reference clock — sits in the distribution, beside
the plugins rather than inside one, and `quotes` reads it from there.

The seeded data already answers everything a dashboard would ask: seven quotes across five statuses,
`openQuoteValue` as a computed sum of what is out, `validUntil` on each quote against a reference
`today()`, and `marginOf` over any set of lines.

## Goals / Non-Goals

**Goals:**

- Show the workspace grammar doing what it is for: several areas, nested, with declared proportions.
- Show that a second domain plugin composes beside the first and reads the same data.
- Give the demo an opening screen that states what the product is about.

**Non-Goals:**

- Charts. A dashboard of drawings would demonstrate a charting library, not this platform.
- New data. Every number comes from what the accounting module already computes; a figure that
  needed a new seed would be a figure the demo invented to look busy.
- A dashboard that is one view. See the decision below — that is the whole point of the change.

## Decisions

**The dashboard is three surfaces the workspace arranges, not one view with a grid inside it.** A
single dashboard component would put the arrangement in CSS, where the platform has no part in it
and the user cannot touch it. As three surfaces the arrangement is declared, and it is the user's
afterwards: they can resize the areas, pull a tile into its own pane, drop one and get it back from
the panel menu, and reset the lot to the declaration. The demonstration and the feature are then the
same thing.

*Alternative rejected:* one `insights.dashboard` surface rendering three cards. Less code and it
would show nothing that a plain Angular application could not.

**The tiles live in a plugin of their own.** They are a second reading of the same data, not more
quotes, and the demo has never shown two domain plugins side by side — which is the arrangement every
real product will have. `insights` gets its own manifest, its own capability grant and its own
translation namespace, exactly like `quotes`, so the demo shows the plumbing a second weaver needs.

*Alternative rejected:* three more surfaces in the quotes plugin. Cheaper, and it would leave the
demo looking like a platform for one plugin.

**The margin tile is gated to the accounting role, and the workspace does not compensate.** The
document already gates its margin child; doing the same here means the sales account meets a
dashboard with one area missing and the other two where they were. That is worth showing, because it
is what role-gated surfaces do to a declared layout, and a demo that hid it would be teaching the
opposite.

**The dashboard takes `initial` from quotes.** Recorded when quotes took it: the flag was put there
so the empty opening state went away immediately, and moving it here was the plan. Quotes keeps its
rail entry and its own declaration; only the flag moves.

## Risks / Trade-offs

**Three tiles of numbers can read as filler** → each answers a question the seeded data makes real:
what is out, what runs out next, what it earns. A tile that needed inventing to fill the layout is a
tile that should not be in the demo.

**The sales account sees a two-area dashboard** → intended, and covered by a case of its own so it
cannot be mistaken for a defect later.

**A second plugin doubles the composition surface a reader has to follow** → that is the lesson, not
a cost: a distribution composes several weavers, and the demo has been quietly implying otherwise.
