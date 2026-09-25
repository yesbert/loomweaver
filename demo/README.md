# LoomWeaver Demo

The showcase product at **[demo.loomweaver.dev](https://demo.loomweaver.dev)**. It is a real product
built on LoomWeaver, not a part of it.

## Why this is its own install root

The platform lives in [`../platform`](../platform). This directory has its own `package.json`, its own
lockfile and its own `node_modules`, and it consumes the `@loomweaver/*` packages it uses (`shell`,
`plugin-sdk`, `frame-kit` and `ag-ui`) **as published packages**, the same way any other product would.
Nothing here reaches into the platform source.

That separation is not tidiness. The platform is meant to carry as few third-party dependencies as
possible, and a demo that shares its install root cannot add a chart library, a date picker or a data
grid without adding it to the platform too. Keeping the two apart is what lets this app use whatever
it needs to look good, while the platform stays lean.

It is also the honest test of the platform. If installing and wiring LoomWeaver is awkward, this is
where we find out, because there are no shortcuts available here that a customer would not have.

Which published line it consumes is a choice, and `package.json` is where it is written down. It
usually tracks the released one. While a preview series is worth showing it tracks that instead,
which is still a line a customer can install, and the status bar says so. A range over a preview
also covers the version that ends the series, so the demo returns to the released line by itself.

## Running it

```bash
npm install
npm start          # http://127.0.0.1:4200, dev server, no service worker
npm run preview    # http://127.0.0.1:4300, builds, then serves it for real
```

Use `npm start` while you work on the app, and `npm run preview` whenever the service worker matters:
installing it as an app, going offline, or the update flow. The two are separate on purpose. The dev
server transforms files per request, so the bytes it serves never match the hashes in the `ngsw.json`
from the same build, and a worker checking every asset against that manifest reports a permanent
"update failed" that looks exactly like a broken deploy. `npm start` therefore registers no worker at
all, and the preview gets its own port so a registration it leaves behind can never take over the dev
server's origin.

The `@loomweaver/*` packages come from the public npm registry, so this needs no registry configuration
and no credential. Everything else is a plain Angular application.

```bash
npm run build          # production build into dist/
npm run lint           # the source and the end-to-end tests
npm test               # unit tests
npm run e2e            # end-to-end suite (starts the dev server itself)
npm run pwa-check      # the manifest and worker promise what they claim
npm run licence-check  # production dependencies against the permissive allowlist
```

## Reading order

1. [`src/app/app.config.ts`](src/app/app.config.ts), the whole product on one screen: the layout's
   regions, the plugins and what each one is granted, the rail and status bar items, one workspace
   per module and the catalog the plugin store reads.
2. [`src/accounting`](src/accounting), the data every module reads. Start here before any view, because
   the views only arrange what this library computes.
3. [`src/customers`](src/customers), the smallest weaver: a plugin file, two views, their strings. The
   other module weavers have the same shape.
4. [`src/quotes`](src/quotes), the fullest weaver: a list, a document that opens as an arrangement,
   a setting, a context menu and the commands the assistant calls.
5. [`src/app/navigation`](src/app/navigation), the module tree in the left sidebar and the list of
   modules the rail and the workspaces are built from.
6. [`public/payments`](public/payments), the plugin that is not part of this application.
7. [`src/agent`](src/agent), the assistant, which drives the rest through the same commands a visitor
   uses.

## What is where

| Where | What it is |
| --- | --- |
| `src/app/app.config.ts` | The composition, read first. |
| `src/app/navigation` | The module list and the module tree in the left sidebar. |
| `src/app/session` | The account switch: signed out, an accounting account, a sales account. |
| `src/app/looks` | The three looks and the switch in the status bar. |
| `src/app/about` | The About dialog behind the status bar badge, which also welcomes a first visit. |
| `src/app/preview` | The status bar badge shown while the demo runs on a preview line. |
| `src/app/legal` | The imprint link in the status bar. |
| `src/app/best-effort-storage.ts` | `localStorage` access that a blocked storage cannot break. |
| `src/accounting` | The shared data library. Not a plugin. |
| `src/quotes` | The quotes weaver. |
| `src/customers`, `src/finance`, `src/procurement`, `src/inventory`, `src/people` | The module weavers, one per module in the rail. |
| `src/insights` | The dashboard on the overview. |
| `src/agent` | The assistant in the right-hand panel. |
| `src/payments` | The icon the application registers for the payment matching plugin. |
| `src/i18n` | The product's own strings and the active language. Every weaver keeps its strings in its own `i18n/`. |
| `src/styles.css` | The theme compile and the few rules the demo's own controls need. |
| `public/payments` | The payment matching plugin: static files, served and isolated. |
| `public/api` | The JSON the demo serves: the plugin catalog and the open items the payment plugin fetches. |
| `e2e` | The end-to-end suite, with shared helpers for the nav tree, the tabs, the accounts, the colour scheme and the plugin store. |
| `tools` | The preview server and the PWA check. |

## What the parts show

### The shared data library

[`src/accounting`](src/accounting) holds amounts in whole cents, VAT computed per rate on the summed
net, customers, suppliers, articles, the sample quotes, the margin rules and the demo's clock. Every
module reads it, which is why the money and tax rules live here rather than in a plugin.

### Quotes

[`src/quotes`](src/quotes) is a searchable, filterable list of quotes with totals. One click previews a
quote into a single reused slot; opening it from the row's menu, or a double click on its tab, keeps
it. A quote opens as an **arrangement** rather than one document, positions on the left, customer and
margin on the right, because the surface declares how it opens, not just what it holds. The margin is
gated to the accounting role, so signing in as the sales account leaves that pane saying _why_ it is
empty instead of leaving it blank.

Three things on it are the product's own decisions rather than the session's:

- **A quote's tab carries its status** beside the number, "Q-0007, Sent", in the tone the list gives
  it. When the assistant sends a draft whose tab sits behind another, that tab changes where it stands
  and nothing comes forward.
- **The margin can be left out.** Settings › App plugins › Quotes › "Show margin analysis", switched
  off, takes the margin out of every quote: no tab, not even the padlock the sales account sees there
  otherwise, and the customer pane takes its room. Switched on, it comes back where it stood.
- **A right-click on a row** opens the plugin's own menu: open, open as preview, or a new quote for
  that customer, worded in the language the page is in.

The quotes workspace **claims** the quote document address, so a quote opens where quotes live however
you reach it: from the assistant, from the command palette, or by following a shared link straight
into one. Without that a document lands in whatever workspace happened to be active, laid over an
arrangement built for something else.

### The modules

[`src/customers`](src/customers), [`src/finance`](src/finance), [`src/procurement`](src/procurement),
[`src/inventory`](src/inventory) and [`src/people`](src/people) are one weaver per module the rail
offers: customer list and contact history; receivables, payables, ledger, closing and a dunning run
that asks before it acts; suppliers and purchase orders with goods to receive; stock levels,
movements and a stock count; employees and payroll runs with the open one to pay. Each lists its
records in a grid that turns into compact lines on a narrow pane, with its own translations and
tests. They are there so the workbench has enough modules to show workspaces, claims and the
navigation tree doing their work.

[`src/app/navigation`](src/app/navigation) draws one tree per module in the left sidebar from a
declaration, hides the areas no plugin answers and renames the panel to the area the visitor is in.
It is the working consumer behind
[A navigation tree in the sidebar](../docs/weaver/navigation-tree.md).

### Accounts

[`src/app/session`](src/app/session) switches between signed out, an accounting account and a sales
account. It exists so gating is visible rather than described: the same screen shows the margin,
hides it behind a reason, or asks you to sign in, depending on who is looking.

### The plugin that is not part of this application

[`public/payments`](public/payments) is the payment matching plugin. No Angular, no import from the
app, no access to it: static files the demo serves, loaded into an isolated frame and talking to the
workbench over RPC. It is listed in the plugin catalog at `public/api/plugins.json` and installed
from the plugin store at runtime; its entry asks for `contributions` and `session`, and nothing else.

There are **two documents** because that is the shape of the rung. `plugin.html` is the entry the
workbench loads in a hidden frame; its job is the handshake and everything the plugin registers with
the workbench: the surface, its settings and the tab badge. `view.html` is the visible surface, mounted where the workbench decides, with a
channel of its own. The matching rule, the strings and the keys both documents share are scripts of
their own, `matching.js`, `strings.js` and `shared.js`.

It **fetches its data** from `/api/open-items.json` rather than being handed it, because a plugin
that is fed cannot be restricted: the moment its data arrives inside its own bundle there is no
longer anywhere to decide what it may see. The file is checked in and a unit test holds it to the
accounting library, so changing a seed without updating it turns red. Since an isolated frame is a
_foreign origin_ to the very site that serves it, that response carries `Access-Control-Allow-Origin`
in all three ways the demo is served (the dev server, the preview server and the vhost), and the
deploy pipeline's smoke check asserts it.

Say plainly what this does not show: **a URL that answers everyone is not an API with a security
model.** The grant gates what the plugin is _told_. Revoke `session` in Settings › Permissions and
the push stops mid-flight, the mounted surface falling back to what a signed-out visitor sees, with
no reload. It does not gate the fetch, and nothing here withholds anything from the plugin. Scoping
what a plugin may read, and minting whatever proves it may, is the product's own backend work; the
platform carries no seam for it today.

It paints with [`@loomweaver/frame-kit`](https://www.npmjs.com/package/@loomweaver/frame-kit), served
under `/frame-kit/`, so the three looks, both colour schemes and the user's text size reach it
through pushed tokens with no palette of its own to keep in sync. Its own strings are English and
German inside the plugin, because it cannot reach the demo's bundles; the tab title, workspace name
and rail tooltip stay translation keys here, because the workbench draws those.

Its tab says **whether anything is still open**: "Open" while an item waits, "Done" once every one is
settled. The view tells the plugin's state what is open, and the plugin's hidden document sets the
badge, the only one of the two that may, because the surface holds no plugin context. So a badge is
set live from a plugin that cannot touch the page.

### The assistant

[`src/agent`](src/agent) is the assistant in the right-hand panel, and the one thing here whose brain
is fake. Say what it is not, first: there is no language model, no key and no network call. It picks
its answers from a script of five prompts, and the panel says so where nobody can miss it.

Everything downstream of that choosing is real, which is the whole reason it exists. It emits genuine
AG-UI protocol events, including argument deltas rather than one finished call; the tool list is read
from the live registry at the start of every run; each call goes through
[`@loomweaver/ag-ui`](https://www.npmjs.com/package/@loomweaver/ag-ui) into the workbench's own command
seam, and the answer carries a real outcome. So the five prompts are five checkable claims: the
content area moves, the dashboard takes the screen without a reload, a confirmation you decline stops
the command dead, the margin is answered for the accounting account and refused for the sales one,
and the look changes everything at once. Two of the five can end in the command **not** running, on
purpose: success proves an integration, refusal proves a boundary.

It is demonstration code. A product that wants a real chat writes its own against `@loomweaver/ag-ui`,
which is published and documented on its own; the recipe is in [`docs/samples.md`](../docs/samples.md).

### Three looks

[`src/app/looks`](src/app/looks) shows the same app in three appearances, through the four levers a
distribution has: colours and type as tokens, measurements as unlayered CSS against the `.lw-*` class
contracts, `provideIcons`, and `provideTranslationOverrides`. The switch lives in the status bar and
**reloads**, because icons and wording are bootstrap-bound: they are composition decisions, not user
preferences. Light and dark stay live within each look.

A look changes how the app _looks_; it never changes whose app it is. The logo and the product name are
wired once in `app.config.ts` and no look can replace them; the only wording a look owns is the
tagline behind the name. The three span an axis on purpose: **Standard** in the middle, **Aurora** the
same shapes in another palette (gold, the second logo colour), and **Breeze** a different palette
_and_ different geometry, with pill controls, softer radii, a wider rail and taller chrome.

### Two things in place from the start

- **Both languages, from the first line.** The product's strings live in
  [`src/i18n/product`](src/i18n/product) and each weaver's in its own `i18n/`, and all of them reach
  the app through a namespaced Transloco bundle, which is the same route a plugin's strings take.
  English and German stay complete together.
- **A suite that guards the seams a build cannot.** Translation bundles are served as build assets, so
  a wrong assets glob does not fail the build; it silently degrades every label to its raw key at
  runtime. [`e2e/smoke.spec.ts`](e2e/smoke.spec.ts) fails instead.

## What is not here yet

Orders and invoices as documents of their own. The quote is the only document; the other modules
are lists with one action each, so the workbench has enough to show.

What the demo changes lives in memory: a new quote, a saved note, a sent quote, a stock count or a
paid run lasts until the page reloads, and the samples come back. The look, the account, the settings
and the arrangement of the workbench survive a reload, because they are stored in the browser.

The one plugin installed from the plugin store at runtime is payment matching, the isolated one;
nothing else arrives that way yet.

What a product may _do_ (`provideShellFeatures`) is still unexercised, which is worth fixing: a
bookkeeping product would not offer pane splitting at all, and a lever nothing touches is a lever
nobody checks.
