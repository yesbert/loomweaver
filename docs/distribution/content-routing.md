# Content-area routing

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `routing` · `content-tabs`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

The content area is URL-addressed: the Angular router runs underneath, and the distribution sets it
up with **`provideShellRouter()`**. This page says what that provider bundles, how the address moves
between panes, and how a tab that follows the current selection gets its address.
[Routing](../reference/routing.md) is the reference for what the router means in practice.

## `provideShellRouter()`

Call it **instead of** `provideRouter([])`. It bundles `withDisabledInitialNavigation()`, the
state-preserving reuse strategy, and the route sync as one unit, so you can't half-configure it. Pass
your own non-content routes as `provideShellRouter([...routes])` if the distribution has any.
Authoring the routes/tabs themselves is the weaver's job: see
[authoring a weaver](../weaver/content-area.md).

## Tabs and the address

Weavers contribute **routable surfaces** (`ctx.registerSurface({ routable: { path } })`). Visiting a
route opens its tab, and a pane draws a tab strip whenever it holds tabs; switching between tabs
preserves state. The one exception is a surface that declares `routable: { chromeless: true }`: a
full-area screen such as login or onboarding, which never becomes a tab and shows no strip while it
is active.

Exactly **one** pane carries the address at a time; every other pane renders what it holds. That role
follows the user: clicking a tab (or into a pane) hands the address to that pane, and navigating to a
surface another pane already holds reaches it **there** instead of opening a second copy beside the
current one. That holds however the navigation was started: an ordinary link inside content, a rail
item, a command, browser history. So a workspace that parks a surface in its own pane keeps working
whatever points at it.

## Following tabs

A weaver may declare a permanent tab as a **facet of the current selection** rather than a document of
its own (`routable: { follows: true }`, see
[authoring a weaver](../weaver/sub-routes-and-follows.md)). The host then
substitutes the parameter values of the address it is on, by name, into that tab's pattern.

Part of that mapping is domain knowledge the platform cannot have, such as a query parameter carried
by one tab deciding a path segment on another. Supply it and the platform keeps its substitution for
everything you pass on:

```ts
// src/app/app.config.ts
provideTabAddressResolver(({ surfaceId, params, activePath }) =>
  surfaceId === 'treaties' && params['cedentId']
    ? `cedents/${params['cedentId']}/treaties/${treatyFor(activePath)}`
    : null,   // null → the host's own substitution
),
```

The resolver is a `TabAddressResolver`, and its `TabAddressInput` carries the following surface's
`surfaceId` and `pattern`, the `params` of the address you are on and that `activePath` in full. Your
answer is taken at its word: the host checks reachability only for its own computation, where an
address that leads nowhere means the facet has no selection yet and its tab is left out.

## Where next

- [Tabs](../distribution-api/tabs.md): the tab strip's own state from your own code, beyond what routing expresses.
- [The address](../concepts/the-address.md): why one pane carries the URL and what has no address.
- [The content area: routes and tabs](../weaver/content-area.md): how a weaver declares the routable surfaces this page routes to.
