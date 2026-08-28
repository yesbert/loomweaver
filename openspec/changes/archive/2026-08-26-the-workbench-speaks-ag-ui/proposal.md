> **Status:** approved.

## Why

The workbench can now describe its own actions and run them for a caller that is not the user, and
the set it offers is already narrowed by everything that would refuse the call. What is missing is
the last mile: something that turns that set into what an agent protocol expects, and turns what the
agent asks for back into a call.

Without it, every weaver that wants an agent writes the same three pieces by hand — a tool list, a
dispatch that maps a tool name to an action, and the accumulation of a streamed call — and the first
of those is the second registry the previous change existed to prevent. A weaver would end up
maintaining its own list beside the workbench's, which is where the two answers to "may this run"
come back.

AG-UI is the protocol worth doing this for. It is the one the agent frameworks converge on for the
frontend hop, it is transport-agnostic, and it is what our first product will speak. It is also at
0.0.x and still moving, which is exactly why this belongs in a package beside the platform rather
than inside it.

## What Changes

- A new published package, `@loom/ag-ui`, at `platform/libs/integrations/ag-ui`.
- It describes the workbench to an agent: what `ctx.invocableCommands()` offers becomes a list of
  tool definitions, with the declared arguments expressed as the schema the protocol wants.
- It owns the tool-call loop. A streamed call is accumulated across its start, its argument deltas
  and its end; the assembled call runs through `ctx.invokeCommand`; the outcome is answered as a tool
  result. A weaver writes no dispatch of its own.
- A weaver MAY put a hook in front of execution. It sees the assembled call before it runs and may
  let it through, decline it, or answer it itself. This is where a confirmation before a heavy step
  belongs, and it is the reason the loop can be owned without being overbearing.
- The three outcomes are carried across faithfully: an answer becomes the result's content, and a
  refusal and a failure both become an error, with text that tells them apart. A tool that was
  refused must not read as one that ran and returned nothing.
- **Nothing about the platform changes.** No package under `platform/libs/core` gains a dependency,
  and no capability gains a requirement.

New to the repository, and worth naming because they are conventions rather than code: a
`scope:integration` Nx tag, allowed to reach only itself and the published contract, and a seventh
package on the shared version line.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The platform guarantees nothing new: this package consumes the plugin contract exactly as a
third-party weaver would, and adding a consumer of a guarantee does not change the guarantee. The
change declares `skip_specs: true` for that reason and exists because the work needs a worklist, not
because it moves a requirement.

## Impact

- New: `platform/libs/integrations/ag-ui` — the package, its build and test targets, and its entry
  in the workspace.
- `platform/eslint.config.mjs` — the `scope:integration` boundary rule.
- `scripts/bump-version.sh` and `azure-pipelines-publish.yml` — a seventh package to stamp and
  publish.
- `platform/libs/weavers/testbed-weaver` and `platform/apps/loom-testbed` — the small piece that
  proves the loop against a scripted agent, with no network involved.
- `docs/` — a guide for a weaver author, and the package README stating that this package's
  stability follows AG-UI rather than the platform.
- Dependency added: `@ag-ui/core`, as a **peer** dependency of the new package only, so a weaver
  that also builds its own agent resolves one copy rather than two. Nothing else in the workspace
  gains a dependency. The design note says why the protocol's *core* rather than its client.
- No legacy source is dissolved by this change.
