# LoomWeaver Demo

The showcase product at **[demo.loomweaver.dev](https://demo.loomweaver.dev)**. It is a real product
built on LoomWeaver, not a part of it.

## Why this is its own install root

The platform lives in [`../platform`](../platform). This directory has its own `package.json`, its own
lockfile and its own `node_modules`, and it consumes `@loomweaver/shell` and `@loomweaver/plugin-sdk` **as
published packages** — the same way any other product would. Nothing here reaches into the platform
source.

That separation is not tidiness. The platform is meant to carry as few third-party dependencies as
possible, and a demo that shares its install root cannot add a chart library, a date picker or a data
grid without adding it to the platform too. Keeping the two apart is what lets this app use whatever
it needs to look good, while the platform stays lean.

It is also the honest test of the platform. If installing and wiring LoomWeaver is awkward, this is
where we find out, because there are no shortcuts available here that a customer would not have.

## Running it

```bash
npm install
npm start          # http://127.0.0.1:4200 — dev server, no service worker
npm run preview    # http://127.0.0.1:4300 — builds, then serves it for real
```

Use `npm start` while you work on the app, and `npm run preview` whenever the service worker matters:
installing it as an app, going offline, or the update flow. The two are separate on purpose. The dev
server transforms files per request, so the bytes it serves never match the hashes in the `ngsw.json`
from the same build, and a worker checking every asset against that manifest reports a permanent
"update failed" that looks exactly like a broken deploy. `npm start` therefore registers no worker at
all, and the preview gets its own port so a registration it leaves behind can never take over the dev
server's origin.

The `@loomweaver/*` packages are not on the public npm registry yet, so until the first public release they
come from LoomWeaver's own feed. [`.npmrc`](.npmrc) names that registry but holds no credential; supply a
token the way the feed expects before the first install. Everything else is a plain Angular
application.

```bash
npm run build          # production build into dist/
npm test               # unit tests
npm run e2e            # smoke suite (starts the dev server itself)
npm run pwa-check      # the manifest and worker promise what they claim
npm run licence-check  # production dependencies against the permissive allowlist
```

## What is here

The branded shell from `@loomweaver/shell` — top bar, activity rail, a collapsible sidebar on each side,
content area — with the product-defining parts in the twenty lines of
[`src/app/app.config.ts`](src/app/app.config.ts), plus:

- [`src/accounting`](src/accounting) — the **shared data library**: amounts in whole cents, VAT
  computed per rate on the summed net, customers, articles, sample quotes and the margin rules.
  Orders and invoices will use the same library, which is why the money and tax rules live here
  rather than in a plugin.
- [`src/quotes`](src/quotes) — the **quotes weaver**, the first plugin: a searchable, filterable
  list of quotes with totals. Picking one previews it; picking it twice keeps it as a tab.
  A quote opens as an **arrangement** rather than one document — positions on the left, customer
  and margin on the right — because the surface declares how it opens, not just what it holds.
  The margin is gated to the accounting role, so signing in as the sales account leaves that pane
  saying *why* it is empty instead of leaving it blank. It is the first nested pane tree here.

  The quotes workspace **claims** the quote document address, so a quote opens where quotes live
  however you reach it: from the assistant, from the command palette, or by following a shared link
  straight into one. Without that a document lands in whatever workspace happened to be active, laid
  over an arrangement built for something else.
- [`src/session`](src/session) — the **account switch**: signed out, an accounting account and a
  sales account. It exists so gating is visible rather than described — the same screen shows the
  margin, hides it behind a reason, or asks you to sign in, depending on who is looking.
- [`public/payments`](public/payments) — the **payment matching plugin, which is not part of this
  application**. No Angular, no import from the app, no access to it: static files the demo serves,
  loaded into an isolated frame and talking to the workbench over RPC. It is registered with
  `provideFramePlugins` and granted `contributions` and `session`, and nothing else.

  There are **two documents** because that is the shape of the rung. `plugin.html` is the entry the
  workbench loads in a hidden frame; its only job is the handshake and the `registerSurface` call.
  `view.html` is the visible surface, mounted where the workbench decides, with a channel of its
  own. A reader of the directory would otherwise wonder why there are two entry points.

  It **fetches its data** from `/api/open-items.json` rather than being handed it, because a plugin
  that is fed cannot be restricted: the moment its data arrives inside its own bundle there is no
  longer anywhere to decide what it may see. The file is checked in and a unit test holds it to the
  accounting library, so changing a seed without updating it turns red. Since an isolated frame is a
  *foreign origin* to the very site that serves it, that response carries
  `Access-Control-Allow-Origin` in all three ways the demo is served — the dev server, the preview
  server and the vhost — and the deploy pipeline's smoke-check asserts it.

  Say plainly what this does not show: **a URL that answers everyone is not an API with a security
  model.** The grant gates what the plugin is *told* — revoke `session` in Settings › Permissions
  and the push stops mid-flight, the mounted surface falling back to what a signed-out visitor sees,
  with no reload. It does not gate the fetch, and nothing here withholds anything from the plugin.
  Scoping what a plugin may read, and minting whatever proves it may, is the product's own backend
  work; the platform carries no seam for it today.

  It paints with [`@loomweaver/frame-kit`](https://www.npmjs.com/package/@loomweaver/frame-kit), served under
  `/frame-kit/`, so the three looks, both colour schemes and the user's text size reach it through
  pushed tokens with no palette of its own to keep in sync. Its own strings are English and German
  inside the plugin, because it cannot reach the demo's bundles; the tab title, workspace name and
  rail tooltip stay translation keys here, because the workbench draws those.

- [`src/agent`](src/agent) — the **assistant in the right-hand panel**, and the one thing here whose
  brain is fake. Say what it is not, first: there is no language model, no key and no network call.
  It picks its answers from a five-line script, and the panel says so where nobody can miss it.

  Everything downstream of that choosing is real, which is the whole reason it exists. It emits
  genuine AG-UI protocol events, including argument deltas rather than one finished call; the tool
  list is read from the live registry at the start of every run; each call goes through
  [`@loomweaver/ag-ui`](https://www.npmjs.com/package/@loomweaver/ag-ui) into the workbench's own command seam,
  and the answer carries a real outcome. So the five prompts are five checkable claims: the content
  area moves, the dashboard takes the screen without a reload, a confirmation you decline stops the
  command dead, the margin is answered for the accounting account and refused for the sales one, and
  the look changes everything at once. Two of the five end in the command **not** running, on
  purpose: success proves an integration, refusal proves a boundary.

  It is demonstration code. A product that wants a real chat writes its own against `@loomweaver/ag-ui`,
  which is published and documented on its own; the recipe is in
  [`docs/samples.md`](../docs/samples.md).

- [`src/looks`](src/looks) — the **same app in three appearances**, through the four levers a
  distribution has: colours and type as tokens, measurements as unlayered CSS against the `.lw-*`
  class contracts, `provideIcons`, and `provideTranslationOverrides`. The switch lives in the status
  bar and **reloads**, because icons and wording are bootstrap-bound — they are composition
  decisions, not user preferences. Light and dark stay live within each look.

  A look changes how the app *looks*; it never changes whose app it is. The logo and the product name
  are wired once in `app.config.ts` and no look can replace them — the only wording a look owns is
  the tagline behind the name. The three span an axis on purpose: **Standard** in the middle,
  **Aurora** the same shapes in another palette (gold, the second logo colour), and **Breeze** a
  different palette *and* different geometry — pill controls, softer radii, a wider rail and taller
  chrome.

Two things are deliberately already in place, because retrofitting either is painful:

- **Both languages, from the first line.** The product's own strings live in
  [`src/i18n/product`](src/i18n/product) and reach the app through a namespaced Transloco bundle,
  which is the same route a plugin's strings take. English and German stay complete together.
- **A smoke suite that guards the seams a build cannot.** Translation bundles are served as build
  assets, so a wrong assets glob does not fail the build — it silently degrades every label to its
  raw key at runtime. [`e2e/smoke.spec.ts`](e2e/smoke.spec.ts) fails instead.

## What is not here yet

Orders, and everything after them. The demo is built one reviewable slice at a time, and each slice
adds its own plugin, its own translations and its own tests next to the ones above.

The theme is accounting: quotes, then orders, then invoices, each as a separate plugin over the
shared data library, with dunning as one installed from the plugin store at runtime. Payment
matching is done, and is the isolated one.

What a product may *do* (`provideShellFeatures`) is still unexercised, which is worth fixing: a
bookkeeping product would not offer pane splitting at all, and a lever nothing touches is a lever
nobody checks.

The data is read-only for now. Editing arrives with the quote document, and the library already has
the `resetQuotes()` seam that a "reset the sample data" command will use.
