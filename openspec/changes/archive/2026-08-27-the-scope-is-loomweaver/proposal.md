> **Status:** approved.

## Why

The packages are about to be published publicly, and the scope they carry is not available. `loom`
was already taken as an organisation on npm; `loomweaver` was secured on 2026-08-27 instead. Every
published name therefore has to change, and it has to change before the first public release, because
a scope rename after publication means deprecating one line of packages and asking every consumer to
rewrite their imports.

## What Changes

- **BREAKING for consumers:** all seven published packages move from the `@loom` scope to
  `@loomweaver`. `@loom/plugin-sdk` becomes `@loomweaver/plugin-sdk`, and so on for `shell`,
  `frame-kit`, `devkit`, `cli`, `mcp` and `ag-ui`. Versions published so far exist only on a private
  feed, so the break reaches no public consumer.
- The internal workspace libraries follow, so that one scope is used everywhere rather than two
  living side by side.
- **BREAKING for the command line:** the CLI installs `loomweaver` instead of `loom`, and the MCP
  server `loomweaver-mcp` instead of `loom-mcp`. `loom` belongs to somebody else on npm, so a
  command by that name is no longer ours to occupy.
- The scaffolding follows: generated code, the manifests the generators write and the assertions
  their tests make all name the new scope, so a freshly scaffolded weaver compiles against packages
  that exist.
- Documentation, the AI-facing files and the demo follow, so no reader is told to install a package
  that cannot be resolved.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. No capability names a package, by the rule that a requirement states behaviour rather than a
library, and none does today: the scope appears nowhere under `openspec/specs/`. What the platform
guarantees is unchanged; only the name under which it is delivered changes. The change therefore
declares `skip_specs: true`.

## Impact

- `platform/tsconfig.base.json`: the path mappings, including the internal `testbed-weaver` alias.
- The seven published `package.json` files under `platform/libs/`, their peer dependencies on each
  other, and the two `bin` entries in `cli` and `mcp`.
- 287 files carry the scope in 915 places: 190 TypeScript files, 65 Markdown files, 12 JSON files,
  the rest configuration and scripts.
- `platform/libs/tooling/devkit` and `platform/libs/tooling/cli`: 20 files that write the scope into
  generated code, plus the tests asserting on it.
- The demo install root, which consumes the packages from the private feed and pins them by name.
- `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `llms.txt`, `llms-full.txt` and 16 files under
  `docs/`.
- `azure-pipelines-build.yml`, `azure-pipelines-publish.yml` and `azure-pipelines-deploy.yml`, which
  name the packages they pack and publish.
- The 33 archived changes that will be published carry the old scope in their prose. They are
  history and are left as written; the rename is not backdated into them.
