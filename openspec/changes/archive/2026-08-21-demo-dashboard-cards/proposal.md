> **Status:** approved.

## Why

The dashboard works and does not look like one. Each tile sits in its own pane, so the screen shows
three tab strips and three sets of pane tools around three small readings — a workbench holding a
dashboard rather than a dashboard. The demo has to convince as well as demonstrate, and this screen
is the first one a visitor sees.

The arrangement it was built to show is already shown, better, by the quote document: positions
beside customer above margin, in one container the user can rearrange. The dashboard was carrying a
demonstration it did not need, at the cost of the impression it exists to make.

## What Changes

- The dashboard becomes one full-area screen without pane chrome, holding a grid of cards.
- The readings become cards that each answer one question and say so in their heading: what is out,
  what it is worth, what runs out next, what was won and at what margin.
- Two of them are charts, drawn with Chart.js in the workbench's own token colours, so they follow
  the colour scheme and both product looks without being told twice.
- The margin card decides for itself whether the account may see it, because a card inside a surface
  cannot be gated by the platform the way a surface can.

## Capabilities

No capability changes. Full-area surfaces without chrome, declared workspaces and role-aware
composition are all guarantees the platform already carries; this change is a product using them.
`.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

- `demo/src/insights/` — one dashboard surface and its cards replace the three tile surfaces.
- `demo/src/app/app.config.ts` — the workspace declares the one screen.
- `demo/package.json` — Chart.js, MIT-licensed, as the demo's first charting dependency.
- `demo/e2e/dashboard.spec.ts` — the cases follow the new shape, including the one for the sales
  account.
