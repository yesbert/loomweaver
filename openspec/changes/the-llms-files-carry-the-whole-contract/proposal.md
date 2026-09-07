# The llms files carry the whole contract

> **Status:** approved.

## Why

`llms.txt` and `llms-full.txt` are what an assistant reads about this platform, and the second
calls its plugin-contract section complete. An audit on 2026-09-07, one pass against the packed
API and the element family and one against the documentation and the specifications, found that
neither file is. The package list, the version line, the Angular version and every link are right.
What is missing is what arrived since late August and a layer underneath that was never there.

The index misses sixteen pages: the fourteen single pages of the distribution API, of which only
the overview is linked, the documentation's own README, and the operations reference, which no
line in either file reaches. The plugin contract omits two `ctx` members added on 2026-09-05,
renaming a surface and asking whether the address lies under one, lists `ctx.state` in prose but
not in the interface it prints, and leaves out fields on views, content routes, dialog options and
settings components. The distribution contract omits `provideRequiredPlugins` entirely although
`llms.txt` advertises it, so the two files disagree on whether the function exists; it omits the
unusable-workspaces block and so prints a wrong signature for `provideWorkspaces`; it omits the
whole isolation model for frame plugins; and it names none of fifteen services the guides
describe, from commands and dialogs to update and version, under a heading that presents the list
as everything a distribution's code may do. The building-block inventory has the tags and not
their attributes or events, and lacks the navigation family. Of the capabilities under
`openspec/specs/`, accessibility is absent without a word, product identity is present only in its
branding half, the layout's narrow viewport and rail names are missing, and no sentence says that
`openspec/specs/` is the contract. One number is wrong in both the file and the page it came from:
the theme has 29 colours and 2 font families, not 27.

The guard that should have caught this could not. `api-docs-check` accepts a published export
that appears anywhere in `docs/` or the llms files, so a name that lives only on a reference page
passes while `llms-full.txt` says nothing. No guard requires a page under `docs/` to be in
`llms.txt`, although one requires it in the site's sidebar.

## What Changes

**The index links every page.** All 73 pages under `docs/` appear in `llms.txt`, each with a
one-line hook, including the distribution API's single pages and the two pages no line reaches.

**The plugin contract is complete by name.** Every export of `@loomweaver/plugin-sdk` that the
checker does not exempt is named in `llms-full.txt`, and the printed `PluginContext` interface
matches the packed declaration member for member.

**The distribution contract is complete by name.** Every export of `@loomweaver/shell` the checker
does not exempt is named, with the seven signatures the audit found incomplete corrected, the
required-plugins, unusable-workspaces and isolation-level blocks written, and the fifteen missing
services listed where the file says what a distribution's code may do.

**The building blocks have their attributes and events.** Each `<lw-*>` tag lists what can be
set on it and what it emits, in the primitives bullet and the frame-kit list alike.

**The capabilities the file was silent on are in it.** Accessibility, the update half of product
identity, the layout's narrow viewport, rail names and rail scrolling, the deep link that survives
arriving before its plugin, and one sentence that `openspec/specs/` is the contract. The tooling
list gains `validate-commands`.

**The number is right.** In `llms-full.txt` and on the design-tokens page.

**And the guards hold it.** `api-docs-check` requires every non-exempt export in `llms-full.txt`
on its own, not in the union of all documentation, because that file is the one that claims to be
complete. `sync-docs.mjs`, which already fails the site build for a page missing from the sidebar,
fails it for a page missing from `llms.txt` too.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. `skip_specs: true` is set in this change's `.openspec.yaml`. The two files describe what the
specifications already require; the guards are tooling.

## Impact

- `llms.txt`, `llms-full.txt`
- `docs/reference/design-tokens.md`, the token count
- `platform/tools/check-api-docs.mjs`, the second pass; `website/tools/sync-docs.mjs`, the index
  check
- Depends on one line outside this change: `PluginIsolationLevel` is not exported from the shell's
  barrel although two public fields use it, so a consumer cannot name the type the file will
  describe. That is a code defect and goes to a branch of its own before this change is applied.
- No published contract and no specification is touched
- No legacy source is dissolved by this change
