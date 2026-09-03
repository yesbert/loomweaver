# PWA and delivery

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `platform-composition`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

**PWA is the default, not a requirement** — the whole decision is one option:
`provideShell()` ships it on (installable app, offline shell, the update badge/toast), and
`provideShell({ serviceWorker: false })` turns it off. Turn it off whenever your build does not emit
a worker — the [scaffolded quick start](../getting-started.md) wires the PWA side for you, the
[manual setup](../manual-setup.md) deliberately starts without it.

`provideShell()` registers the service worker itself, inert in dev — **do not add
`provideServiceWorker` to your own providers.** That is why `@angular/service-worker` is a peer
dependency rather than an optional extra: the shell imports it, so your build needs it installed
whether or not you ship a worker.

What you supply is the build side, and only the first line is required for the update flow:

| | Where | Needed for |
| --- | --- | --- |
| `ngsw-config.json` + `serviceWorker` in the build target | project root · `angular.json` or `project.json` | the worker exists at all — without it, registration 404s |
| `manifest.webmanifest` + icons | `public/` | installability (home screen, standalone window) |

Build with the production configuration to exercise either; the update badge and toast read one
signal, so the version/update chrome works with no wiring.

**Two of those details decide whether the app is really installable and really offline, and neither
one fails a build.**

*Icons.* A manifest without an `icons` entry cannot be installed at all, and Chromium only offers
installation once the manifest names a **192 and a 512 raster** icon; an SVG is fine for the browser
tab and is what the scaffold points at, but it does not satisfy that check, and iOS ignores manifest
icons entirely in favour of an `apple-touch-icon` link. So ship `icon-192.png` and `icon-512.png`,
name them in the manifest, and add the `apple-touch-icon` link. Keep `purpose: "any"` and
`purpose: "maskable"` on **separate files** — a maskable icon is cropped to a circle or a squircle
and needs padding that an edge-to-edge mark does not have, so one file cannot be correct as both.

*Translations.* The shell fetches its UI strings at runtime, so an asset group that does not cover
them produces an app that installs, opens offline and renders **every label as its raw translation
key**. Nothing errors. Cache them explicitly:

```jsonc
// ngsw-config.json — alongside the "app" and "assets" groups
{
  "name": "i18n",
  "installMode": "prefetch",
  "updateMode": "prefetch",
  "resources": { "files": ["/i18n/**/*.json"] }
}
```

**No worker at all?** Pass `provideShell({ serviceWorker: false })`. Registration is skipped,
`UpdateService.enabled` reports `false` and no update is ever offered — the service injects
`SwUpdate` optionally, so nothing else changes. Use it whenever your build emits no
`ngsw-worker.js`; otherwise production logs a failed registration for a file that was never built.

The update chrome is honest about failures and long-lived sessions. A failed installation
(`VERSION_INSTALLATION_FAILED`, e.g. a hash mismatch after a broken deploy) raises a sticky
"update failed — reload" toast and flips the badge to a caution state instead of claiming the app is
current, and the shell checks for updates in the background (every 30 minutes and whenever the tab
becomes visible again), so a tab that stays open for days still learns about a deploy without a
navigation.

The two ways an update goes wrong are told apart, because only one of them a reload can fix:

| State | What it means | What the affordance does |
| --- | --- | --- |
| `UpdateService.updateFailed` | An update could not be installed. The worker is healthy and the client keeps running its current version. | Reloads, which retries the install. |
| `UpdateService.updateBroken` | The worker reported an unrecoverable state: its cached asset table no longer matches what the server serves. | Unregisters the worker, drops its caches, then reloads into a fresh registration. |

The distinction matters because a plain reload cannot leave the second state. The broken registration
would still control the next load and report the same failure, which is a loop the user cannot escape
from inside the app; they would have to know to clear the site's browser storage. A deploy that
removes the previous build's hashed files (anything using `rsync --delete`) is enough to put a client
there. Only the shell's own `ngsw-worker.js` and its `ngsw:` caches are touched, so a worker or cache
your product registered itself is left alone. Read `updateBroken` only if you want to word it
differently in your own UI; the built-in toast and badge already do.

**Validate the service worker against a build, never against the dev server.** The Angular dev
server transforms files per request. The bytes it serves therefore do not match the hashes in the
`ngsw.json` it emits from the same build. The worker verifies every asset against that manifest. So
serving the *production* configuration through `ng serve` makes each watch-mode rebuild end in
`VERSION_INSTALLATION_FAILED` — the sticky "update failed" toast, permanently, from a perfectly
healthy build. That failure is indistinguishable from a broken deploy by design (the client only
sees a hash mismatch), so do not paper over it in the update chrome: run the dev server with the
development configuration, where the shell never registers a worker, and exercise the PWA and
update flow against a served build instead. This repo does both, in both install roots: the platform
has `npm run start:testbed` and `npm run preview:testbed`, the demo has `npm start` and
`npm run preview`. Two details of that pattern are worth copying rather than rediscovering.

**Give the preview its own port.** A worker's scope is the origin, so a registration a preview leaves
behind keeps controlling the dev server on the same port and serves you the stale cached build
instead of your edits.

**Serve the preview over plain HTTP on `127.0.0.1`, not over HTTPS with a self-signed certificate.**
Browsers already count loopback as a secure context, so the worker registers with no certificate at
all. A self-signed one is worse than none here: the page loads, `isSecureContext` is `true`, and the
worker script fetch still fails the certificate check with "An SSL certificate error occurred when
fetching the script". Nothing registers, and the preview silently stops previewing the one thing it
exists for.

---

**Next:** [The plugin system](../plugins.md) — the three rungs of trust and the four ways in, capabilities and what the user controls ·
[Backend integration](../backend-integration.md) — wiring your own backend behind the three seams.

## Where next

- [Building a distribution](../building-a-distribution.md): the composition root and the map of these pages.
- [Distribution API](../reference/distribution/index.md): everything your own code can do once the product runs.
