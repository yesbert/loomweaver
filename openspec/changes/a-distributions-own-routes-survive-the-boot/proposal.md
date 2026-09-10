> **Status:** approved

## Why

A distribution can hand the workbench routes of its own, and the published contract says so in as
many words: *"Pass `extraRoutes` for any non-content routes the distribution owns."* The workbench
then throws them away. When the shell mirrors the plugin-contributed content routes into the router
it replaces the whole route table, and everything the distribution declared is gone with it.

Measured on `main`: a distribution that declares a redirect at the bare address and a page of its
own ends up with the route table `["popout/**", "dashboard"]`; reaching its own page fails with
`NG04002: Cannot match any routes`. The redirect never fires, so the bare address stays bare and its
content area stays empty, with no message. Our own demo never passes routes of its own, which is why
nothing here noticed.

## What Changes

- The routes a distribution declares stay reachable for the life of the application, alongside the
  routes plugins contribute, and survive every later change to the set of contributed routes.
- A contributed content route and a distribution's own route for the same address no longer race by
  accident: the change states which one answers.
- No new surface. The seam the distribution already uses is the one that starts keeping its promise.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `routing`: adds the guarantee that addresses a distribution owns keep resolving once plugin
  content routes are in place, and says how an address claimed by both is resolved.

## Impact

- `platform/libs/core/shell/src/lib/regions/content/routing/content-router.ts` — the route table is
  rebuilt from the contributed routes alone.
- `platform/libs/core/shell/src/lib/regions/content/routing/provide-content-router.ts` — carries the
  JSDoc the implementation contradicts, and receives the distribution's routes today.
- Consumers that pass routes of their own. None of our first-party distributions do: the demo calls
  the seam without routes, and NextPA Studio and NextPA platform-admin both call it without routes
  and reach the same end by subscribing to the router themselves.
