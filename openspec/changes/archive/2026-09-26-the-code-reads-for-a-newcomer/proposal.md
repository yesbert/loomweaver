> **Status:** approved.

## Why

A review read every source file of the repository with one question: can a person who opens this
code for the first time find the right file quickly and understand it without help? Line by line the
answer is mostly yes. Between files it is often no. The same knowledge is written down in several
places and some copies have already drifted into defects, files were pressed under the 400-line
threshold instead of being cut, names say something other than what a file holds, folders are not
where a reader looks, and the demo and the example teach two ways of doing the same thing, in places
the opposite of what `docs/` teaches. The review found 362 such places and 44 defects across the
shell, the published packages, the tooling, the testbed, the demo, the example, the website and the
repository's tools. This change is the worklist for the first kind. The defects are worked in their
own change, `defects-found-while-reading-are-fixed`, because fixing them changes behaviour.

## What Changes

Nothing a consumer can observe. Every slice keeps behaviour as it is, and the tests stay green
without a changed expectation.

- **Knowledge is written once.** Among others: the pop-out window fact, the "settings-backed signal"
  pattern with its parsers, the storage keys, the retention key grammar, the layout queries, the tab
  label rules and tree walks, the pane toolbar rules, "which chrome item is offered", the element
  kit's definition list, the capture message shape, the surface field list, the Nx amendments that
  the CLI already applies, and in the demo the language and date helpers.
- **Files are cut by what they do.** The files that sit at the 400-line threshold are cut into parts
  with one reason to change each: the content tab services, the iframe surface, the pane tree service,
  the retained view stash, the workspace service, the contribution registry, the plugin context, the
  menu service, the CLI's run and amend files, and the demo's and the testbed's oversized plugin
  scripts.
- **Folders say what they hold.** Pure moves, each in its own pull request: `commands/` into keyboard
  and palette, the frame-plugin code out of a folder called `sandbox/`, the contribution registry into
  a slice of its own, the unsaved-work code into one place, the plugin contract's 22 flat files into
  five sub-themes, the testbed weaver from technical kinds into the capabilities it exercises, and the
  three folders recorded over the threshold in the structure baseline brought under it.
- **Names say what a thing is.** One word per concept where several are used today (carries the
  address, deployed, frame plugin, chord, container), and names left behind by an automatic
  abbreviation fix (`index` for an item, `function_`, `index_`) replaced by the word meant.
- **Dead code and leftovers go.** Code only specs still call, an unused route-reuse function, route
  data nobody reads, a proxy file for a server the platform does not have, a test reporter for a
  pipeline that moved.
- **Published text states the present.** JSDoc, package READMEs and the shipped stylesheet lose
  references a reader cannot resolve, project history, roadmap promises, other products' names and
  German words, and gain one plain sentence where a hover is empty. No declaration changes shape.
- **The teaching material teaches one way.** The demo's and the example's READMEs match their code,
  the demo's weavers take one shape and keep their strings in their own namespace, and the example's
  agent wiring matches `docs/ag-ui-agents.md`.
- **Tests, with a lighter lens.** Oversized specs split along the source they test, tracker codes in
  test names replaced by the behaviour, narration comments removed from the demo's end-to-end tests.

Renaming or removing a published symbol is not part of this change. The review's list of those is in
`design.md` for the owner to decide; an item that is accepted becomes a change of its own.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The change sets `skip_specs`: it guarantees nothing new and alters nothing guaranteed. Where a
slice would have to change behaviour to become readable, the behaviour change leaves this change and
goes to the defects change or to a change of its own.

## Impact

- **Code:** `platform/libs/core/shell`, `platform/libs/core/plugin-sdk` (file layout and JSDoc text
  only, exports unchanged), `platform/libs/core/frame-kit`, `platform/libs/integrations/ag-ui`,
  `platform/libs/tooling/{cli,devkit,mcp}`, `platform/libs/weavers/testbed-weaver`,
  `platform/apps/*`, `demo/`, `examples/assistant-workbench/`, `website/`, `platform/tools/`,
  `website/tools/`, `scripts/`.
- **Generated consumer code:** the devkit's emitted files change in wording and names where a slice
  says so; `docs/scaffolding.md` and `docs/samples.md` follow in the same pull request.
- **Guards:** `platform/tools/structure-baseline.json` loses its three folder entries
  (`plugin-sdk/src/lib`, the testbed weaver's `views` and `plugin`), and
  `platform/tools/cycle-baseline.json` shrinks where a move dissolves a slice pair. The checkers that
  read files by path (`check-command-names.mjs`, `check-region-ids.mjs`, the devkit theme recipe spec)
  follow the files they read.
- **Docs:** links into moved files in `llms.txt`, `docs/distribution/auth.md` and the guides follow the
  move in the same pull request. `docs/reference/operations.md` stops stating how many entries the
  baselines hold, since those counts had already gone stale.
- **Not affected:** the published export lists, the specs, the release version line.
