## Context

The review behind this change (see proposal.md, Why) read about 750 source files and their
configuration, split into eleven areas, each read in full by one reviewer against the rules in
`CONTRIBUTING.md` ("Code conventions") and `openspec/config.yaml`. Every finding was checked against
the code before it was recorded, and every claimed defect was reproduced from the code by a second
reader. A textual clone scan over the whole tree found little literal copying (0.5 % of lines); the
duplication that matters is the same knowledge written in different words, which only reading finds.

Three facts shape the approach:

- The repository runs guards that make some cuts expensive: the structure ratchet (12 concepts per
  folder, 400 lines per file), the import-cycle ratchet between shell slices, the comment checker that
  reads the packed declarations, and the lint rules for member order and inline templates. A cut that
  adds a concept to a full folder needs a move first.
- Several checkers and docs read source files by path (`check-command-names.mjs`,
  `check-region-ids.mjs`, the devkit theme recipe spec, `llms.txt`, a few guides). A move that forgets
  them passes locally and breaks a guard later.
- The published packages are consumed by products outside this repository. Their export lists are the
  compatibility boundary; their file layout inside the package is not.

## Goals / Non-Goals

**Goals:**

- Every finding of the review is either done or deliberately set aside with a reason recorded here.
- The measure the owner accepts on the calibration slice holds for all later slices.
- The structure baseline loses its folder entries; the cycle baseline shrinks where a move allows it.

**Non-Goals:**

- Behaviour changes of any kind, including fixes. They go to `defects-found-while-reading-are-fixed`.
- Renaming or removing a published symbol, a translation key or a published element attribute.
- New abstractions for a single user. A helper is extracted only where two or more places hold the same
  knowledge today.
- Rewriting what reads well. Most files were marked "ok" and stay untouched.

## Decisions

**One slice is one pull request, and a move never shares a pull request with a content change.** A
diff that moves forty files and edits ten of them cannot be reviewed; git also loses the history of a
file that is moved and rewritten at once. Alternative considered: one pull request per area. Rejected
because a single area (the shell's pane regions) already touches about sixty files.

**A slice proves it kept behaviour with the existing tests.** The tests of the touched code run
unchanged, apart from import paths and renamed symbols. A test whose expectation has to change is the
sign that the slice changed behaviour; the slice stops and that part moves to the defects change.
Specs that are split along a source file are moved, not rewritten.

**Defects are fixed before the refactoring of the same code.** Where a finding and a defect touch the
same place (the list menu's two builders, the rail curation filter, the pane toolbar's close rule, the
sidebar's keyboard move, the frame declaration build, the agent adapter's flush, the demo's month
list), the test-first fix lands first, so the refactoring cannot hide it and the test guards the
refactoring.

**Cross-cutting knowledge comes before the per-area cuts.** The shared helpers (pop-out fact,
settings-backed signal, storage keys, retention keys, layout queries, tab labels, pane affordances,
wording changes) remove code from many files at once. Cutting a large file first and removing its
duplicated half afterwards would touch it twice.

**The calibration slice is the content tab services.** It holds two of the three files pressed to
exactly 400 lines and the hardest naming question (two tab services a newcomer cannot tell apart). The
owner reviews its result; the measure it sets (how small methods get, how far names change, how a
file is cut) is written below under "Agreed measure" and applies to every later slice.

**Published text is corrected, published shapes are not.** JSDoc, package READMEs and the shipped
stylesheet are consumer documentation, so stale or unresolvable statements in them are defects of the
text and are fixed here. Declaration shapes stay; where the review proposes deriving one published
type from another (`ContentSurface` from `SurfacePresentation`, the retention fields through a `Pick`),
the slice compares the packed declarations before and after and keeps the change only if a consumer
sees the same shape.

**Findings on the published surface are listed, not done.** They are below under "For the owner". Any
item the owner accepts becomes its own change, because it breaks consumers or adds to the contract.

**The teaching material follows the docs, not the other way round.** Where the demo or the example
contradicts `docs/`, the code moves to what the docs teach, unless the docs are wrong; then the docs
are corrected in the same pull request and the reason is stated in its description.

## Set aside, with reasons

- **The language keeps its own stored binding (task 2.2).** It applies the stored language to the
  translations and to `<html lang>` synchronously while it is constructed, and it ignores a stored code
  it does not serve, keeping the language it has. `persistedSetting` would apply the value through an
  effect, one tick later, and fall back to the browser language for an unserved code. Both are
  behaviour a user could notice.
- **The panels keep their own binding (task 2.2).** Their state lives on the working-state port and
  deliberately follows no other window, while `persistedSetting` is the settings port with cross-tab
  sync. They share the record parsers instead.

- **The unsaved dot stays written where it sits (task 5.7).** The tab strip draws it four times, but
  in four frames: in the corner of an icon tab, in the pinned slot, swapped with the close mark on
  hover, and in a plain slot. One template would need the frame passed in and a wrapper added to two
  of them, which changes the markup a product may style and reads no better.
- **The view menu slot constant sits with the strip tab, not with its menu (task 5.8).** Its menu is
  registered in the panel region, and the pane region reads the constant; putting it there would make
  the two regions import each other. It left its one-constant file for `strip-tab.ts`, beside the
  tab menu context it names.
- **No shared docked-view body component (task 4.5).** A surface kept in place (an iframe) is hidden
  inside the element that holds its anchor and waits there. A shared component would become that
  element, and it is destroyed whenever the pane switches away from the view, which would take the
  hidden frame out of the page and reload it on return. Keeping the injector factories in the two
  hosts avoids that, but then only an eight-line template branch is left to share, which does not
  pay for a new element in the chrome.
- **The route data key `urlDriven` keeps its name (task 4.3).** The surface route data is typed now,
  but the key is published: the plugin contract's JSDoc on sub-routes, two guides and the assistant
  file tell a weaver to read `data.urlDriven`, and weavers do. Renaming it to `carriesAddress` breaks
  them, so it is listed for the owner instead.

- **No `lwLabel` pipe (task 2.8).** The strips resolve "a key unless marked literal" with the
  translation pipe in two templates. A pipe of our own would have to reproduce what that pipe does
  while a bundle is in flight: nothing until the bundle has loaded, the key once an empty one has.
  Built from the translation pipe's constructor, it would tie the shell to that library's internals.
  The minimised strip's second derivation of title and icon went; the two ternaries stay.

## Risks / Trade-offs

- [A move silently breaks a checker or a doc link that reads the file by path] → Every move slice
  greps the repository, including `llms*.txt`, `docs/`, `platform/tools/` and `website/`, for the old
  path before it is opened, and runs the full guard set.
- [A split creates a new import cycle between shell slices] → `npm run import-cycles-check` runs on
  every shell slice; a move that creates a pair is redesigned rather than recorded in the baseline.
- [Long-running work collides with feature work on the same files] → Slices are small and merged as
  they are done; nothing waits for the whole change.
- [A generated file changes wording for consumers who compare scaffolds] → Changes to emitted code
  land with the matching change to `docs/scaffolding.md` and `docs/samples.md`, and are named in the
  release notes of the release that carries them.
- [Renaming a demo surface id orphans visitors' saved arrangements] → Accepted for the demo; named in
  the pull request.

## Migration Plan

None for consumers: no published name or shape changes. Each slice merges on green CI. If a slice turns
out to have changed behaviour after merging, it is reverted as a whole, which is why moves and content
changes are never mixed.

## Agreed measure

Agreed with the owner on the calibration slice (the content tab services), and binding for every
later slice:

- **Cut size.** A file does one job and lands between roughly 150 and 250 lines. A published entry
  point may be longer where the length is its JSDoc, as long as its code only delegates.
- **Names.** A file is named after the class it holds, in kebab case; `.service` appears in the file
  name exactly when the class name ends in `Service`. A class is named for what it holds or does
  (`ContentTabState`, `TabNavigationService`), not for its technical kind.
- **Published text travels with the code.** When a slice touches a file that carries published JSDoc,
  that JSDoc is corrected in the same slice: no tracker codes, no history, no roadmap promises, no
  other products' names, one plain opening sentence. Task group 9 then covers only the files no
  earlier slice touched.
- **Small visible improvements are allowed when named.** A slice may turn a swallowed failure into a
  logged one, and says so in its pull request. Anything a user or a consumer's code could notice
  beyond that goes to the defects change.
- **A cut does not push a neighbour over the threshold.** Where finishing a cut would lift another
  file over 400 lines, that part waits for the task that cuts the other file, and the pull request
  says so.
- **Tests follow the source.** A spec is split along the files it drives, keeps one file-local setup
  helper, and its names state the behaviour. No expectation changes in a refactoring slice.

## For the owner

These came up in the review but are outside this change, because each changes the published surface
or is a choice about how the product presents itself. They are listed so nothing is lost; none blocks
a task below unless the task says so.

**Published symbols (breaking if accepted):**

- The plugin contract exports four host-internal shapes that authors are told not to build (`View`,
  `ContentRoute`, `ContentRouteBase`, `ContentSurface`); they could move to the shell.
- `ViewAction` is the surface action type under a retired name; `LwButtonVariant` and `LwButtonSize`
  are the only prefixed SDK types; `OpenOptions` does not say what it opens; `Disposable` shadows the
  language's global of the same name; `FrameSetting*` uses a third word for "sandboxed";
  `setChildShown(id, shown)` is a flag parameter; the adapter's `CommandAccess` reuses the word
  "access"; `DialogRef`'s public constructor exposes host wiring.
- In the shell: the `command` attribute and event detail of `<lw-menu-item>` carry keys that are not
  commands; `DialogInstance` is a bag of kind-specific optional fields; `<lw-option icon>` shows the
  name as text where every other element draws the icon; `LwSpinner` is an Angular component inside
  the custom-element kit; `PaneRef.dock` means a region id while "dock" also means a side;
  `FontScaleService` names what the UI calls text size; `InstalledPlugin` also types plugins the user
  never installed; `PluginEnablementService.register` keeps a roster, not enablement; twelve
  undocumented `ContentTabsService` members exist only for the shell's own use; `AppResetService.reset`
  takes a flag; three `provide*` functions of one slice return three shapes; two
  `SettingsService` members have no caller; `LocaleService.supported` names what the rest calls
  served; two workspace tokens are exported although their JSDoc says a distribution never injects
  them; the plugin store's and permissions' translation keys live under `settings.*`.
- The route data key `urlDriven` names what the workbench everywhere else calls "carries the
  address"; a rename to `carriesAddress` would need both keys for a release.
- Additive, so a patch if accepted: `CommandService.trigger` taking the menu context (lets the menu
  stop running items its own way), a shared options base for the two search-entry providers,
  `Recipe.amend` on the weaver and auth-source recipes, a surface-shaped entry point on
  `ContributionRegistry`.

**Choices about presentation and policy (they change tasks marked "after the owner's decision"):**

- Whether the no-comments rule covers CSS and `.astro` files. The comment checker lists `website/src`
  as a root but reads one file there; the shell's shipped `theme.css` carries about sixty comments that
  reach consumers.
- The demo's shape: flatten the quotes weaver like the other five, or give all six the scaffolded
  library shape; move the composition folders (`session`, `looks`, `navigation`, the status-bar bits)
  under `app/`; one idiom for record lists (the responsive grid the quotes and customers views use);
  the `demo-` selector prefix for product components instead of the platform's `lw-`.
- The example's selector prefix, which is the generator's default.
- Whether the feature-flag declaration stays in `foundation/`, as the engineering standards name it
  there, although only `features/` and diagnostics import it.
- Whether `platform/tools/` gets sub-folders for gates, media and local servers, which touches CI paths.
- Whether the per-project lint `inputs`, which repeat `nx.json` and name files that do not exist, are
  removed from all eleven `project.json` files at once.
