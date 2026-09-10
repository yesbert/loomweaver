## Context

See proposal.md — Why. What the implementation does today, in one paragraph: the routes a
distribution hands over are given to the router once, at provider time. When the shell later mirrors
the plugin-contributed content routes it calls `resetConfig` with a table it builds from scratch —
the popout route, the contributed routes, and a placeholder for a deep link whose plugin has not
arrived yet. Nothing carries the distribution's routes into that table, and the reset happens both at
start-up and on every later change to the contributed set, so they are gone for good.

## Goals / Non-Goals

**Goals:**

- The distribution's routes are part of every table the shell builds, not only of the first one.
- The order inside the table is decided here, once, rather than falling out of provider order.

**Non-Goals:**

- No new provider, option or token on the published surface. The seam a distribution already calls
  keeps its signature; only what the shell does with the routes changes.
- Not the second half of the story: what a distribution's redirect for the bare address competes
  with is decided in `the-declared-start-holds-on-every-opening`, and neither change depends on the
  other.

## Decisions

**The routes are remembered where the shell can reach them, and re-applied on every reset.**
The seam that receives them keeps them in a token the router service reads when it rebuilds the
table. The alternative — splicing them back into `router.config` after each reset — was rejected
because it leaves two places that know the table's shape, and the second one runs after Angular has
already matched a URL against the first.

**Order in the table: popout, then the distribution's concrete routes, then the contributed content
routes, then the deep-link placeholder, then the distribution's catch-alls.** Three separate reasons
pin those positions:

- The popout address is the platform's own window plumbing and answers before anything a product
  writes, as it does today.
- A distribution's concrete route comes before the contributed ones because the distribution
  composes the product: if it declares an address a plugin also serves, it is correcting what it
  ships, and the correction has to reach the router. The alternative — plugins first — makes the
  distribution's declaration a silent no-op, which is the failure mode this change exists to remove.
- A catch-all (`**`, or a path that starts with it) is moved behind the contributed routes because
  Angular matches in order: a 404 page declared by a distribution would otherwise answer for every
  plugin address in the product. This is the one place where the shell reorders what the
  distribution wrote, and it is why the requirement states the limit next to the guarantee.

**The duplicate is reported, not resolved silently.** When a distribution's concrete address is also
a contributed content address, the developer is told in development, in the shape this codebase
already uses for contested declarations. The address still resolves to the distribution's route: a
warning explains, it does not decide.

**The report is recomputed where the table is.** The contributed set changes over the life of the
application, so a duplicate can appear long after start-up. Emitting from the same place that builds
the table keeps the two from drifting; a set of already-reported addresses keeps a plugin toggled
back and forth from printing the same line each time.

## Risks / Trade-offs

- **A distribution route shadows a plugin surface and someone is surprised.** → The development
  warning names the address. In production nothing is printed, as everywhere else in this codebase.
- **The reordering of catch-alls is a rule the distribution author did not write.** → It is stated
  in the requirement rather than only here, and it only ever moves a route later, never earlier: a
  route that answered before this change still answers.
- **A distribution route inside the content area meets no tab machinery.** That is the existing
  behaviour for a route without content data, and it is what the seam's own documentation promises
  ("non-content routes"). Pinned by a scenario so it cannot regress into an accidental tab.
