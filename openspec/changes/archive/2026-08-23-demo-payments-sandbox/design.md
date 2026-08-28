## Context

See proposal.md — Why. What shapes the approach is not the motivation but four properties of a
frame plugin at the **isolated** level, which is the level this plugin runs at and the reason it is
worth building — the demo is showing what happens to code nobody vouched for. It is not composed at
the embedded level, and saying so is part of the point: that level exists for an organisation's own
applications, and a payment tool standing in for somebody else's is exactly what it is not for.

1. **A registration carries no data.** `FramePlugin` is `{ id, entryUrl, capabilities, level,
   origins }`, and the two fields beyond the first three decide isolation and where the plugin's
   documents may come from. There is still no seam through which a distribution hands a plugin data
   of its own, and there should not be: a plugin that needs data fetches it, so that what it may see
   is decided where such decisions belong.
2. **At this level the frame has a foreign origin.** It is embedded as
   `<iframe sandbox="allow-scripts">` with no `allow-same-origin`, so its documents cannot read the
   application's DOM, storage or address — the point of the exercise — and are, to the browser, a
   stranger to the very site that serves them. Reaching that site is a cross-origin request carrying
   `Origin: null`, which the response must permit explicitly.
3. **Only data crosses the RPC boundary, from a fixed vocabulary.** The workbench pushes the active
   language, the presentation, the resolved tokens, the interface size, the surface's position in
   the address, whether it is currently being shown, and the session where the plugin was granted
   it. Domain data is not in that vocabulary, and should not be added to it for a demo.
4. **The surface must come from a permitted origin, and the demo permits none.** Where a plugin's
   composition names no origins, the application's own is the only one — which is what this plugin
   wants, since the demo serves its files itself. Its `index.html` ships `frame-src 'self'`, pairing
   with the seam's own check.

One property of the demo matters as much. Its sample quotes are seeds, not figures:
`src/accounting/quotes.ts` names articles and quantities, and amounts come from the catalogue and
the VAT rules at read time. Nothing in the repository holds the number the payment view has to show.

## Goals / Non-Goals

**Goals:**

- One area of the demo whose code is not the demo's, is visibly not Angular, and is
  indistinguishable from the chrome around it.
- The plugin obtains its data the way it would obtain it from a product — by asking a URL — so the
  demo does not teach a shape that would have to be unlearned.
- The boundary is legible rather than hidden: what the plugin was granted, what it therefore
  receives, and what happens when a grant is taken away.

**Non-Goals:**

- **A backend.** The data is static, so the URL is a file. Nothing runs, nothing is installed, and
  no process has to be kept alive for the demo to work.
- **An API security model.** Deciding what a plugin may read, and proving it may, needs logic on a
  server the demo does not have and a seam the platform does not carry. Explicitly the product's
  work, and named as such in the README rather than faked here.
- **Installing a plugin at runtime.** The store rung is the next slice and needs this one first; a
  catalog entry has the same shape this change composes at build time, so nothing here is redone
  for it.
- **Writing anything back.** Matching is confirmed inside the plugin and changes no quote. The
  demo's data stays read-only until the editing slice.
- **Extending the platform.** If the rung turns out to be short of something the demo needs, that
  is a finding and becomes its own change against the capability — not an adjustment made here.

## Decisions

### The demo's data gets a URL, and the URL is a file

`demo/public/api/open-items.json` lists what is still open — quote number, customer, gross total.
`public/` is copied to the root of the build, so the file is reachable at `/api/open-items.json`
under `ng serve`, under the preview server and on the vhost alike, with nothing added to any of
them.

*Why not hand the data to the plugin* — because a plugin that is fed cannot be restricted. The
moment its data arrives as part of its own bundle, there is no longer a place where anyone could
decide what it may see. Fetching keeps that place, even while the thing being fetched is a file.

*Why not a mock server* — there is nothing to mock. The demo's data does not change, so a process
computing it would be ceremony around a constant, and it would have to exist in three environments
instead of none.

*Why not the app read it too, through `httpResource()`* — that is a worthwhile change and it is not
this one. It turns every synchronous read in `src/accounting` into an asynchronous one and ripples
through every view and its tests. Keeping it out leaves this change about isolation.

### One header, in the three places the demo is served

The response needs `Access-Control-Allow-Origin: *` or the frame cannot read it (context, 2). All
three serving paths already have somewhere to put it:

- `ng serve` — the `headers` option of `@angular/build:dev-server`, which its schema documents as
  applying to every response. It cannot be scoped to a path, which is acceptable for a dev server.
- the preview — `demo/tools/preview-server.mjs` is ours and sets headers already; there it is
  scoped to `/api/`.
- production — the deploy pipeline writes `.htaccess` files and the vhost has `mod_headers`, so
  `api/` gets its own block, and the pipeline's closing smoke-check asserts the header the same way
  it already asserts the cache headers.

A missing header fails loudly rather than subtly: the plugin sees a network error and says so.

### The file is checked in, and a test holds it to the library

A unit test in the demo imports the accounting library, computes what is open, and compares it to
the JSON. Changing a seed without updating the file turns it red.

Chosen over generating the file during the build. Generation makes disagreement impossible rather
than merely detectable, which is the stronger property, but it costs a build step wired into three
lifecycle hooks, a bundler invocation to run TypeScript outside Angular, and a file nobody can read
in the repository. A fifteen-line test buys the same protection for a demo whose data changes
rarely and deliberately. If the data ever stops being static, this decision is the one to revisit.

The sample bank statement is a different thing and stays inside the plugin: it stands for the file
a user would hand the tool, not for anything the product knows.

### It is reached as a workspace, like the other two areas

A `payments` workspace holds the plugin's surface as its content, with a rail entry carrying
`workspace: 'payments'` — the construction the dashboard and quotes workspaces already use, so the
isolated area is a peer rather than a curiosity. A rail entry navigating straight to the route would
have made the one plugin that is not ours the one entry that behaves differently.

The surface declares `retain: 'always'`, so switching away and back does not tear down the frame,
re-run the handshake and lose what the user confirmed.

### The grant is the smallest one that still shows something

`contributions` — without it the plugin cannot register its surface at all — and `session`, so the
workbench pushes `{ authenticated, roles }` and the plugin can gate itself. Nothing else: no `ui`,
no `navigation`, no `host`. The plugin neither toasts nor navigates, and a grant it does not need
would blunt the default-deny reading.

`session` earns a case of its own: revoking it in the Permissions settings stops the push while the
surface stays mounted, and the plugin falls back to what it shows a signed-out visitor. Default-deny
reaching *into* the frame, live, is the part of the model that is hard to believe from prose.

Note what the grant does **not** do: it does not gate the fetch. The URL answers anyone, and the
plugin could read it without any grant at all. That is the honest shape of a demo without a backend,
and the README says so rather than letting the two be confused.

### The plugin gates itself; the platform cannot do it here

A surface behind the boundary cannot carry the declarative `access` requirement — the seam rejects
it, because a plugin that could ask the host to hide it could ask about anything else. So the
accounting-only part of the view is drawn, or not drawn, by the plugin, from the pushed session.
The dashboard's margin card already follows that reasoning one rung lower; saying it twice is
deliberate, because it is the rule rather than an exception.

### The plugin carries its own strings; the workbench keeps the titles

The plugin cannot reach the demo's translation bundles, so the strings it draws itself live inside
it, in English and German, re-rendered when the pushed language changes. The strings the *workbench*
draws for it — tab title, workspace name, rail tooltip — stay translation keys in the demo's own
bundle, because the workbench resolves them. The split follows the line between what is drawn inside
the frame and what is drawn outside it.

### It paints with the kit, not with a palette of its own

`@loom/frame-kit` joins on the platform's version line and is served under `/frame-kit/` by an
assets glob, the well-known path the kit's documents assume. The surface loads `lw-frame.css` and
`lw-elements.global.js` and uses `<lw-*>` elements and `.lw-*` classes, so the three looks, both
colour schemes and the user's text size reach it through the pushed tokens with nothing to keep in
sync. The kit and `@loom/shell` move together; a mismatch is a version error, not a styling one.

### Matching is a rule a visitor can check by eye

A statement line matches an open item when its reference contains that item's quote number. The
match is *confirmed* when the amounts agree and *flagged* when they do not, and a line matching
nothing is left unassigned. The sample statement is composed so all three occur. A rule the visitor
can verify against the figures on screen is worth more than a plausible one they must trust, and it
keeps the end-to-end assertions exact.

## Risks / Trade-offs

- **A URL that answers everyone reads like an API that does not.** → The README states plainly that
  the demo shows fetching rather than authorisation, and that scoping is the product's backend work.
  Better to name the gap than to build a fake lock.
- **The isolated rung is documented as experimental — the exposed `ctx` is minimal and still
  growing.** → That is the reason to dogfood it. Anything the demo cannot do because the rung is
  short stops this change and becomes a change against `plugin-sandbox`; it is not patched around
  in the demo, which would hide the very defect the exercise exists to find.
- **The header has to be right in three places that are maintained separately.** → Two of them are
  verified by tests that already run: the end-to-end suite covers dev, and the deploy pipeline's
  smoke-check covers production. The preview is the one a human must try, which is what the README
  already asks of anyone touching service-worker behaviour.
- **The kit and the shell must stay on one version.** → They already do, because the demo consumes
  the published line and the consume step bumps both. A mismatch surfaces as broken elements in the
  frame, which the end-to-end case asserting a kit-drawn control will catch.
- **The installed app must keep the plugin offline.** → Today's service-worker configuration caches
  root-level scripts and styles, translations and images; the plugin's documents, the kit's assets
  and `/api/` match none of those patterns. They get their own asset group, and the existing
  `pwa-check` run proves the manifest still promises what it claims.
- **Two documents, two channels, one plugin.** → The logic document registers, the surface document
  paints, and each has its own connection. That is the rung's shape rather than the demo's choice,
  and it belongs in the README because a reader of `public/payments/` will otherwise wonder why
  there are two entry points.

## What this change now waits on

The demo consumes the `@loom/*` packages **as published**, which is what makes it an honest test of
the platform. The vocabulary this change is written against — `provideFramePlugins`, `@loom/frame-kit`
served at `/frame-kit/` — is on the main branch and is **not on the feed**. The published line still
carries the old names.

So this change cannot begin until a release ships the renamed packages and the demo consumes it.
That is a decision rather than a step, and it is the owner's: nothing here should tempt anyone into
reaching into the platform source instead, because the whole reason the demo installs separately is
that it must not.

## Rollout

Nothing to migrate: no existing behaviour changes and the demo deploys as a whole. The change is
complete when the demo builds, its unit tests and end-to-end suite pass against the published
packages, the deploy pipeline's smoke-check confirms the header, and the licence gate stays green —
`@loom/frame-kit` is Apache-2.0 and the only new dependency.
