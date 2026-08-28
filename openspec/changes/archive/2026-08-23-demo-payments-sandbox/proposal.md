> **Status:** approved.

## Why

Every plugin the demo runs is compiled into it. That makes for a convincing product and a
poor argument, because an application that composes its own code is what any framework produces.
The claim this platform actually makes — that it will run code the operator did not write, in
isolation, and that the result is indistinguishable from the chrome around it — is nowhere on
screen. A visitor cannot see it, and we cannot point at it.

Payment matching is the slice the demo was always going to spend on this. It is the one accounting
step where the tool is plausibly somebody else's: a bank statement goes in, matches come out, and
nobody wants that code holding the ledger. The demo can make that reasoning visible instead of
describing it.

## What Changes

- The demo gains a **payment matching plugin that is not part of the demo**: static files served
  under `/payments/`, loaded into an isolated frame, talking to the workbench over RPC. No Angular,
  no import from the application, no access to it.
- **It fetches the data it needs from a URL the demo serves**, the way it would fetch it from a
  product's API. The demo's sample data is static, so that URL is a JSON file under `public/api/` —
  no server, no logic, nothing to run. What makes it work at all is one header, because the
  isolated frame is a foreign origin to its own application.
- It is reached the way the other two areas are — its own workspace with a rail entry — so it sits
  beside the dashboard and the quotes as an equal, not as a demonstration parked somewhere.
- It looks native, because it paints with the workbench's own elements and tokens from
  `@loom/frame-kit`, which the demo starts serving under `/frame-kit/`. A colour scheme change
  and a language switch reach it without it knowing either exists.
- It gates itself: with the accounting role it matches, without it, it says why it cannot. The
  workbench pushes the session; the plugin decides. That is the only way a surface behind the
  boundary can gate at all.

## Capabilities

### New Capabilities

None. Isolated plugins, their permission model, workspaces and role-aware composition are all
guarantees the platform already carries; this change is a product using them for the first time.

### Modified Capabilities

None. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

- `demo/public/payments/` — the plugin: entry document, logic, surface document, surface script.
- `demo/public/api/open-items.json` — the demo's data at a URL, plus the unit test that holds it to
  the accounting library.
- `demo/src/app/app.config.ts` — the grant, `provideFramePlugins`, the workspace and the rail
  entry.
- `demo/angular.json` — the `@loom/frame-kit` assets glob and the dev server's header;
  `demo/tools/preview-server.mjs` and `azure-pipelines-deploy.yml` — the same header for the other
  two ways the demo is served.
- `demo/ngsw-config.json` — the plugin, the kit and the data as cached assets, so the installed app
  still has them offline.
- `demo/package.json` — `@loom/frame-kit` on the platform's version line.
- `demo/e2e/payments.spec.ts` — new; `demo/README.md` — the plugin list and what is not here yet.

Nothing is dissolved: no decision record, guide or specification is superseded by this change.
The demo's own README claims payment matching as future work, and this change is that work.

**What this change does not claim.** A URL that answers with data is not an API with a security
model. Scoping what a plugin may read, and minting whatever proves it may, is the product's own
backend work — and the platform carries no seam for it today, in any capability. The demo shows
that an isolated plugin fetches rather than is fed; it does not show anything being withheld from
it.
