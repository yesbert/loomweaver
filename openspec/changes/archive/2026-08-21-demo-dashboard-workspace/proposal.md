> **Status:** approved.

## Why

The quotes workspace showed that a product can declare where the user starts. It did not show the
part of the grammar that makes workspaces worth having: an arrangement of several areas, nested and
proportioned, that a product hands out ready-made. Its content is a single tab.

A dashboard is the honest way to show it, because a dashboard is genuinely several things at once.
It also gives the demo an opening screen that says what the product is for before it says what the
user must do.

Second of four workspace changes.

## What Changes

- A second domain plugin, `insights`, contributes three surfaces that read the accounting data the
  quotes plugin already reads: the pipeline, the quotes about to expire, and the margin.
- A dashboard workspace arranges those three in two levels — one wide area beside a column of two —
  with declared proportions.
- The dashboard becomes the workspace a first visit starts in; quotes keeps its own entry and is one
  click away.
- Its rail entry ships with it, under an icon of its own.

## Capabilities

No capability changes. The platform already guarantees declared workspaces, their grammar, role-gated
surfaces and rail entries that switch workspaces; this change is a product using them.
`.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

- `demo/src/insights/` — new plugin: three surfaces, their templates and its translation namespace.
- `demo/src/app/app.config.ts` — the plugin, its grant, the workspace, the rail entry, the namespace.
- `demo/angular.json` — the asset glob that serves the new namespace.
- `demo/e2e/` — cases for the arrangement and for what the sales account sees.
- The quotes workspace loses `initial`, as recorded in its own design note.
