## 0. Before any of this can start

- [x] 0.1 A release ships the renamed packages, and the demo consumes it — the vocabulary below is
  on main and not on the feed, and the demo installs only what is published. Releasing is the
  owner's call, not a step to take unasked.

## 1. The demo can host a frame plugin at all

- [x] 1.1 `@loom/frame-kit` joins the demo's dependencies on the same version line as
  `@loom/shell`, and an assets glob serves it under `/frame-kit/`.
- [x] 1.2 A first, empty plugin loads: entry document, the handshake, one surface that says nothing
  yet — registered with `provideFramePlugins` and granted `contributions`.
- [x] 1.3 The surface is reachable as its own workspace with a rail entry, beside the dashboard and
  the quotes, and retains rather than reloads when it is switched away from.

## 2. The data gets a URL

- [x] 2.1 `public/api/open-items.json` lists what is still open — quote number, customer, gross
  total — and answers at `/api/open-items.json`.
- [x] 2.2 A unit test computes the same list from the accounting library and fails if the file
  disagrees with it.
- [x] 2.3 The response carries `Access-Control-Allow-Origin` in all three ways the demo is served:
  the dev server's `headers` option, the preview server, and the `.htaccess` block the deploy
  pipeline writes.
- [x] 2.4 The deploy pipeline's closing smoke-check asserts that header, the way it already asserts
  the cache headers.
- [x] 2.5 The plugin fetches the URL and reports a failed fetch in its own view rather than showing
  an empty one.

## 3. The payment view

- [x] 3.1 The statement and the open items are drawn side by side with the kit's elements and
  classes, so the view is indistinguishable from the chrome around it.
- [x] 3.2 Each line is matched by reference: confirmed where the amounts agree, flagged where they
  differ, unassigned where nothing matches — and the sample produces all three.
- [x] 3.3 A match can be confirmed or dismissed in the view, and what is still open is stated as a
  figure the visitor can check against the open items.
- [x] 3.4 English and German, carried by the plugin, re-rendered when the pushed language changes.

## 4. What the boundary does, made visible

- [x] 4.1 The plugin is granted `session` and gates the matching itself: the accounting account
  matches, the sales account is told why it cannot, a signed-out visitor is asked to sign in.
- [x] 4.2 Revoking `session` in the Permissions settings stops the push live, and the mounted
  surface falls back without a reload.
- [x] 4.3 The colour scheme, the three looks and the text size reach the surface through the pushed
  tokens, with no colour or font of its own to keep in sync.

## 5. It survives being installed

- [x] 5.1 The plugin's documents, the kit's assets and `/api/` are cached by the service worker, so
  the installed app still has the payment view offline; `pwa-check` stays green.

## 6. Pin it

- [x] 6.1 End-to-end: the payments workspace opens the isolated surface, the figures are the ones
  the demo's own data yields, and the three match outcomes are all present.
- [x] 6.2 End-to-end: the sales account and the signed-out visitor each meet the view they should.
- [x] 6.3 End-to-end: switching the colour scheme repaints the surface, and a kit-drawn control is
  still drawn — which is also what catches a kit and shell that have drifted apart.

## 7. Say what it is

- [x] 7.1 `demo/README.md` gains the plugin: why there are two documents in `public/payments/`, why
  the plugin fetches its data instead of carrying it, and — plainly — that a URL answering everyone
  is not an API with a security model. Payment matching leaves the "not here yet" list.

## 8. Verify

- [x] 8.1 Build, unit tests, end-to-end suite, `pwa-check` and the licence gate pass against the
  published packages.
- [x] 8.2 Anything the isolated rung turned out to be short of is written down as its own change
  against `plugin-sandbox`, not worked around here — `retained-surface-survives-workspace-switch`,
  `permissions-state-the-real-rung` and `frame-plugin-has-a-display-name`.
