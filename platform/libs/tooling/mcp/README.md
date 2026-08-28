# @loomweaver/mcp

An MCP server that exposes LoomWeaver's scaffolding + validation to AI assistants. A thin,
transport-neutral wrapper over `@loomweaver/devkit`'s pure generation + validation cores — so an agent that
is not inside this repo (a chat assistant, a remote client) can scaffold and validate over the wire.

## Tools

- `list_generators` — the available generators.
- `scaffold_weaver` · `scaffold_frame_plugin` · `scaffold_distribution` · `scaffold_auth_source` ·
  `scaffold_settings_store` · `scaffold_theme` · `scaffold_layout` — return a **file map**
  (`path -> content`); the client writes the files into its project.
- `validate_manifest` · `validate_i18n` · `validate_catalog` — return structured `Finding[]`.

## Consume from npm (product repos)

> **Availability:** the `@loomweaver/*` packages are not on the public npm registry yet — the first
> public release publishes them. Until then they come from LoomWeaver's own package feed, and
> `npx` needs that registry configured for the `@loomweaver` scope.

`@loomweaver/mcp` ships as a self-contained bundle (devkit + the MCP SDK are inlined — no transitive
install). A product repo that already consumes `@loomweaver/shell` / `@loomweaver/plugin-sdk` just adds the
server to its `.mcp.json`; `npx` fetches the bundle and starts the stdio server:

```json
{
  "mcpServers": {
    "loomweaver": { "command": "npx", "args": ["-y", "@loomweaver/mcp"] }
  }
}
```

The AI assistant in that repo then has `scaffold_*` + `validate_*` — scaffolding LoomWeaver weavers,
distributions, and integrations without LoomWeaver's Nx workspace or a local devkit checkout.

## Run locally (stdio, from source)

From the Nx workspace root (`platform/`):

```sh
nx bundle mcp                             # bundles a self-contained dist/main.mjs
node libs/tooling/mcp/dist/main.mjs       # start the stdio server
```

To point a client at the local build instead of the published package, use a repo-root-relative path (an MCP
client resolves `args` from the repo root):

```json
{
  "mcpServers": {
    "loomweaver": { "command": "node", "args": ["platform/libs/tooling/mcp/dist/main.mjs"] }
  }
}
```

## Architecture

- `src/lib/tools.ts` — transport-neutral tool handlers over `@loomweaver/devkit` (unit-tested; no SDK/zod).
- `src/lib/server.ts` — the MCP wiring + zod input schemas.
- `src/main.ts` — the stdio entry (bin `loomweaver-mcp`).

A remote/HTTP transport is a thin later addition over the same `createMcpServer()`.
