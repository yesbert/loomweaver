# The generator writes the navigation tree, and the session's verbs

> **Status:** proposed — not approved for implementation yet.

## Why

Two recipes on the samples page are written by hand today, and both are the kind the generator
exists for.

Recipe 11, a navigation tree in the sidebar, is four files that come out the same every time: a
declaration as data, a bridge to `ctx`, a component and its template. Every product with more than
a handful of routes writes them, and the only part that is the product's own is the declaration.
Recipe 12, a session without a backend, is half written already: the `auth-source` generator emits
the three states and one step around them, and the plugin that turns the step into sign-in,
switch and sign-out, with a rail item to reach them, is copied from the page.

The rule this repository works by is that what the generator can take over belongs in the
generator, and the documentation covers the rest. The two recipes were written first so that what
the generator writes has been read, copied and run before it is fixed in a template.

## What Changes

**A navigation generator.** A new scaffold beside `auth-source` and `layout`, not an option on
`weaver`, because a navigation tree spans a product's modules rather than one plugin. It writes
recipe 11 for a named module: the declaration with a placeholder group, the bridge, the component
with the deepest-group retitle, the template, and the `registerSurface` call into a plugin of the
product's own, docked in `left-panel`. All three adapters offer it from one description, the way
every generator is offered.

**`auth-source` writes the verbs.** The generator gains the plugin recipe 12 shows: three commands
gated by `access`, a rail item whose menu carries them and shows the display name or initials, and
the wiring lines for `app.config.ts`. What it writes is exactly the recipe, so the samples page's
generator table moves recipe 12 from half written to written, and recipe 11 joins it.

**The docs follow.** The recipe table on the samples page, the scaffolding guide's generator list
and option tables, the tooling READMEs, the MCP tool list, and `llms-full.txt`'s tooling line.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None yet. The change starts with `skip_specs` because the shape is still to be decided: whether a
new generator needs a requirement of its own under `scaffolding`, the way the agent-ready weaver
has one, is settled when the design is written, and the delta is added before the build starts.

## Impact

- `platform/libs/tooling/devkit`, the recipes and the two generators, and the schema parity test
- `platform/libs/tooling/cli` and `platform/libs/tooling/mcp`, the same generators offered
- `docs/samples.md`, `docs/scaffolding.md`, `llms-full.txt`, the tooling READMEs
- Depends on `the-docs-explain-the-navigation-tree-and-a-session-without-a-backend` having been
  merged, because the recipes are what the generators write
- No legacy source is dissolved by this change
