> **Status:** approved.

## Why

The generators name a product's components with the platform's own prefix unless told otherwise, so
`<lw-ticket-view>` from the example and twenty-two `lw-` components in the demo read exactly like the
workbench's elements `<lw-button>` and `<lw-menu>`. A reader cannot tell what LoomWeaver ships from
what the product built. The scaffolding contract already says generated output takes its naming from
the workspace it is generated into; a default that names it after the platform fails that promise.
The owner decided on 2026-09-25 that the generators read the prefix from the workspace instead.

## What Changes

- Without a supplied prefix, a generated weaver takes the prefix its composing application already
  declares, on every route that can read the workspace (the Nx generator and the CLI).
- Where the application declares none, or where the route cannot read the workspace (the MCP server,
  which returns files for the assistant to place), the default is Angular's own neutral `app`, never
  the platform's `lw`. The MCP tool's description asks the assistant for the application's prefix.
- A generated distribution declares `app` as its prefix unless one is supplied, so a weaver generated
  into it later takes `app` too.
- A supplied prefix wins on every route. The Nx generator already honoured one; the CLI and the MCP
  server could not be given one at all, because the option was offered only to Nx, so the weaver
  scaffold's `prefix` becomes an option of all three. It is checked for kebab-case wherever it
  arrives, since only Nx checked the pattern before.
- The guides that describe `--prefix` say where the default comes from.

Projects generated before this change keep what they have; only new output is affected. No published
type changes; the CLI and the MCP server gain an option, which is additive. The release notes name
the new default under "Changed".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `scaffolding`: *Generated output is for the consumer's project, not the platform's* gains a scenario
  for output generated without a naming prefix. The requirement already demands naming taken from the
  workspace; the scenario pins the case the generators miss.

## Impact

- `platform/libs/tooling/devkit`: the weaver recipe's default, the Nx weaver and distribution
  generators (`generators/weaver/nx-files.ts`, `generators/distribution/nx-files.ts`), the reading of
  the composing application's configuration (`generators/workspace-tree.ts`).
- `platform/libs/tooling/cli`: the scaffold command reads the Angular application's prefix.
- `platform/libs/tooling/mcp`: the weaver tool gains `prefix`, described by the shared scaffold
  option it reads.
- `platform/tools/check-quick-start.mjs`: the quick start's agent panel is now
  `app-copilot-agent-panel`, because a fresh Angular application declares `app`.
- `docs/scaffolding.md`, the devkit, CLI and MCP READMEs, `llms-full.txt` where they describe
  `--prefix`.
- Follows up, outside this change: task 13.5 of `the-code-reads-for-a-newcomer` moves the example's
  components to `app-`, and 12.14 moves the demo's to `demo-`.
