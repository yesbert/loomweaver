## Context

See proposal.md, Why. What stands before the design is written:

- The generators live as recipes under `platform/libs/tooling/devkit/src/recipes`, each a pure
  function from input to a file map, and three adapters offer every recipe from one description:
  the Nx generator, the CLI and the MCP server. A schema parity test holds the three together.
- `auth-source` writes one file, `<name>-auth-source.ts`, with `<name>AuthSource()` and
  `cycle<Name>User()`. Recipe 12 on the samples page shows that file unchanged and adds
  `src/session/session.plugin.ts` plus four provider lines.
- Recipe 11 is four files under a weaver plus a `registerSurface` call; its retitle picks the
  deepest matching group, which the browser run behind the recipe found necessary.
- The scaffolded layout has one rail, `primary`, and the panels `left-panel` and `right-panel`.

## Goals / Non-Goals

**Goals:**

- A product gets a working sidebar navigation and a working stand-in session from one invocation
  each, and what lands is byte for byte what the samples page shows.
- The samples page's generator table stays true by changing rows, not by rewriting recipes.

**Non-Goals:**

- Generating the declaration's content. The generator writes one placeholder group with one
  destination at the module's own route; the product fills it in.
- A login page or dialog. Those stay the product's own, as the auth guide says.

## Decisions

To be written when the change is taken up. The questions it must answer:

- A new `navigation` generator, or a `--navigation` option on `weaver` that writes the tree into
  the weaver's own sidebar surface. The proposal leans to the former; the demo's shape is the
  argument, and the counter-argument is a product with one weaver that wants a tree of its own.
- Whether `scaffolding` gains a requirement for the navigation generator, the way the agent-ready
  weaver has one, or whether the existing requirements already cover any generator that is added.
- Whether the `auth-source` generator writes the plugin by default, or behind an option, given
  that a product with a real session does not want the verbs at all.

## Risks / Trade-offs

- **The generator and the recipe drift.** → One test compares the generator's output for the
  documented invocation with the fenced blocks on the samples page, the way the quick-start check
  compares what a scaffold serves with what the guide promises.
- **A product that ran `auth-source` before this change gets a second plugin it did not ask for.**
  → The generator writes nothing over an existing file without `--force`, which the scaffolding
  spec already requires.

## Open Questions

The three decisions above are open on purpose: this change is recorded so that the queue holds it,
and shaped when it is taken up, after the recipes have been merged and read.
