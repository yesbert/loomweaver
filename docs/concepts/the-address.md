# The address

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `routing` · `content-tabs` · `containers` · `popout-windows`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

This page explains what the browser's address bar means in a workbench with several panes. The
how-to pages linked at the end show the code.

## Content has an address

Content in the main area has an address, so a link can be shared, the browser's back and forward
buttons work, and a reload returns the user to where they were. The platform owns the mechanics:
`provideShellRouter()` is the Angular router, a `routable` surface becomes an ordinary route once
plugins have activated, and `routerLink`, `ActivatedRoute` and query parameters behave as they do
anywhere. What an address *means* below its first segments belongs to the plugin that claimed it.

## One pane carries it

With several panes open, exactly one is the **address pane**: the one whose content the address bar
reflects. Focusing another pane moves that role to it and the address follows; it never rebuilds the
pane. Navigating to a surface another pane already holds reaches it there instead of opening a second
copy. Every navigation behaves the same whoever started it, a click, a deep link, browser history or
a plugin's own call.

## What has no address

A surface docked in a sidebar has no address; a plugin's `navigate` on it is a no-op with a warning in
development. A pop-out window is a viewer onto one surface: it freezes the address it opened with and
refuses content navigation, because there is nothing else in that window to navigate to. A retained
surface is mounted off the router on a fabricated route, which is why it cannot carry `subRoutes`.

## Inside a container

A container is a workspace in a tab, and a child inside it may carry a relative address
(`{ surface, segment }`). The browser address then names the focused child, so deep links, back and
forward and reload work inside the container as they do outside it.

## Where to act on it

- [The content area](../weaver/content-area.md): declaring a routable surface.
- [Sub-routes, the rest, and tabs that follow](../weaver/sub-routes-and-follows.md): what a plugin
  does with the segments below its own.
- [Containers](../weaver/containers.md): relative addresses for children.
- [Content-area routing](../distribution/content-routing.md): the router the distribution sets up.
- [Routing](../reference/routing.md): what carries over from the Angular router unchanged.
