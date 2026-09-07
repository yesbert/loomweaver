## Context

See proposal.md, Why. What shapes the approach is how the two files are built and guarded.

- `llms.txt` is an index: one line per page with a hook, grouped the way the site's sidebar is.
  `llms-full.txt` is the contract in one fetch: printed interfaces with inline comments, then
  prose blocks per concern, then the list of docs. Both are written for the repository with
  repo-relative links; `website/tools/sync-docs.mjs` copies them verbatim and makes the links
  absolute for the site.
- `platform/tools/check-api-docs.mjs` reads the packed declarations of the four published
  contracts, not the source barrels, collects every exported name, subtracts an exemption map that
  names each exemption's reason, and requires the rest to appear in the union of every page under
  `docs/`, the two llms files and the README. It runs after `nx package plugin-sdk && nx package
  shell`.
- `website/tools/sync-docs.mjs` walks `git ls-files docs/**`, and among its checks fails the build
  for any page whose route is not in `sidebar.mjs`. The llms files are on its verbatim list, so it
  already reads them.
- The audit's two reports are in the conversation that produced this change, dated 2026-09-07.
  Their lists are reproduced in tasks.md by identifier. They are a starting point, not the
  acceptance criterion: the guards are.

## Goals / Non-Goals

**Goals:**

- An assistant that reads `llms-full.txt` and nothing else can name every published export and
  knows what each `<lw-*>` element accepts and emits.
- An assistant that reads `llms.txt` can reach every page under `docs/`.
- Both stay that way without anyone remembering: a new export or a new page fails a build until
  the files know it.

**Non-Goals:**

- Rewriting the files' structure or voice. They are the strongest thing on the site, and the
  discoverability change said so; this change fills gaps in the shape they have.
- Describing the demo, the website or the tooling internals. The files are about the platform a
  consumer builds on.
- Explaining any capability at the length of its guide. A block in `llms-full.txt` is the
  guarantee in a few lines and a pointer at the page.
- The navigation-tree page and the two recipes. `the-docs-explain-the-navigation-tree-and-a-
  session-without-a-backend` adds them and their own llms entries; this change is applied after it
  and picks up its pages through the index check.

## Decisions

### Complete means every non-exempt export is named in `llms-full.txt` itself

The checker gains a second pass. The first stays as it is: every export appears somewhere in the
documentation. The second requires every export to appear in `llms-full.txt` alone, with the same
exemption map, because the exemptions are about what a name is, element plumbing or a value type
behind a documented attribute, and that does not change with the file.

*Alternative rejected: a separate exemption list for the llms pass.* Two lists of exemptions are
two places to keep true, and the audit found no name that should be documented in `docs/` and
withheld from an assistant.

*Alternative rejected: leaving the checker and fixing the files once.* The nav tree shows what
happens: two feature pull requests, one file touched, checker green. A claim of completeness that
nothing enforces is the defect this change exists for.

### Every page is in the index, with no exceptions

`sync-docs.mjs` already knows every page and already fails on one missing from the sidebar. It
gains the same check against `llms.txt`: the page's repo-relative path must appear as a link
target. The operations reference and the documentation README are pages under `docs/` and are
linked like the rest, each with a hook that says who it is for.

*Alternative rejected: an allow-list for pages an assistant does not need.* The first entry on
such a list is a judgement, the second is a habit, and the audit found two pages nobody had
decided to leave out.

### The isolation level is described once the type can be named

`FramePlugin.level` and `PluginCatalogOptions.maxLevel` are typed with `PluginIsolationLevel`, and
the barrel does not export it. Describing a model in the contract file whose type a consumer
cannot import would document a defect as a feature. The one-line export goes to its own branch,
outside this change, and the llms block that describes the model is written after it has merged.
The second pass of the checker will require the name anyway, which is the order enforced.

### Signatures are corrected from the packed declarations, not from source

The seven signatures the audit found incomplete are rewritten by reading
`platform/dist/libs/core/shell/types/loomweaver-shell.d.ts` after packaging, which is what the
checker reads and what a consumer sees. Where source exports more than the package publishes, the
package wins.

### The missing capabilities get blocks in the file's existing shape

Accessibility, the update lifecycle, the narrow viewport, rail names and scrolling, and the
surviving deep link each become a short prose block beside the concern they belong to, in the
voice the file already has: what is guaranteed, what a plugin inherits and what it must do itself,
and the page to read. One sentence in the mental-model section states that `openspec/specs/` is
the contract and where a guide and a spec disagree, the spec is right.

### The number is corrected, not removed

"27 colours" becomes 29 colours and 2 font families, in `llms-full.txt` and in
`docs/reference/design-tokens.md`, read from `theme.css`. A count is a second thing to keep true,
but here it says something a reader uses, that the whole palette is small enough to override by
hand.

*Alternative rejected: a checker that counts the tokens.* One number, two places, and the
design-tokens page is already the reference a token change edits. A guard for it would cost more
than it saves.

## Risks / Trade-offs

- **The second checker pass forces names into `llms-full.txt` that add nothing but a name.** →
  The exemption map is where such a name goes, with its reason, visible in review; the audit's
  list of missing type names is short and each carries a field a consumer sets.
- **`llms-full.txt` grows past what a context window reads comfortably.** → The additions are
  names, fields and short blocks, a few hundred lines on nine hundred; the file remains one fetch
  and the index remains the small one.
- **The audit lists in tasks.md are stale by the time the change is applied.** → Task 1 re-runs
  the two audits; the lists guide the work and the two guards decide when it is done.
- **The index check fails the site build for the sibling change's new page.** → That change adds
  its own index entry, and this one is applied after it.

## Open Questions

None. Whether the operations reference should carry a hook that marks it as being for contributors
is wording, not structure.
