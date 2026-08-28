> **Status:** approved.

## Why

The platform guarantees that a product can define workspaces in code — a declared arrangement of
rows, columns and proportions, its own sidebar occupancy, and a workspace a first visit starts in.
The demo demonstrates none of it: it never calls the workspace declaration at all, so it opens in
the built-in empty workspace and greets a first-time visitor with "Nothing open yet" beside an empty
right panel. The most distinctive thing the workbench does is the one thing the demo does not show.

This is the first of four workspaces, and it goes first because it needs no new view and no new
data: every surface it arranges already exists.

## What Changes

- The demo declares a workspace for the everyday case: the quote list in the left panel, one quote
  open in the content area, the customer card in the right panel.
- It is the workspace a first visit starts in, so the empty opening state is gone.
- The right panel keeps no occupant here. Filling it was tried and dropped: the customer surface
  takes its subject from the address, which a sidebar view does not have. The region is left to the
  customers workspace, which brings a view that stands on its own.
- An end-to-end case pins what a reader is being promised: the workspace is offered, opens as
  declared, and a reset returns it to that arrangement.

## Capabilities

No capability changes. The platform already guarantees defined workspaces, their baselines and the
declared starting workspace; this change is a product using them. `.openspec.yaml` therefore sets
`skip_specs: true`.

## Impact

- `demo/src/app/app.config.ts` — the workspace declaration, and the composition that carries it.
- `demo/src/quotes/src/lib/plugin/quotes.plugin.ts` — the customer surface gains a dock.
- `demo/src/i18n/product/` — the workspace title.
- `demo/e2e/` — the new end-to-end case.

No platform source is touched, and the demo consumes the published packages unchanged.
