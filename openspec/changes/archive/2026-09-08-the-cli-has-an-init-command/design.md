## Context

See `proposal.md`, Why, and the delta under `specs/scaffolding/`. What exists:

- The CLI has one scaffold command per descriptor and four validators, runs without a workspace,
  and where it finds one wires it: the style pipeline, the build target, the composition root. It
  records a package the output needs in the manifest and does not install it. Under Nx it merges
  build targets into the project's configuration but does not register a project.
- The Nx collection (`@loomweaver/devkit`) registers the project, sets the import alias and adds
  the asset glob; it is the fullest route and needs to be installed as a dev dependency.
- The docs' getting-started page is the three-block sequence; the assistant guide quotes it.
- The site syncs `docs/**/*.md` to Starlight pages as markdown, never MDX, and rewrites links in
  prose while leaving fenced blocks alone.

## Goals / Non-Goals

**Goals:**

- `npx @loomweaver/cli init` in a fresh `ng new` app produces the product Getting started ends
  with today, in one command and one wait.
- The same command in an Nx workspace produces what the Nx generators produce.
- Nothing interactive; everything a flag; a trial run that is true.

**Non-Goals:**

- No `ng new`, no workspace creation, no project templates.
- No change to the individual scaffold commands; `init` sequences them.
- No MDX on the site for the tab group.

## Decisions

**`init` is an orchestration, not a recipe.** It runs the existing steps in order: detect the
workspace, detect the package manager, install, scaffold the distribution with `--out .`, scaffold
the first weaver into `src/<id>`, print the summary. The distribution's amendments do not depend on
a directory, so `--out .` wires the application today, as Getting started shows; the weaver lands
in a subdirectory, so the CLI's empty-directory guard is never reached. The first draft of this
note named `the-cli-at-the-workspace-root-still-wires` as a prerequisite; it is not. The generator cores are untouched;
what `init` adds is detection, installing, and the sequence. Alternative: a new recipe that emits
everything at once. Rejected: it would duplicate the two recipes and drift.

**Under Nx, `init` installs the collection and runs its generators.** Detection: `nx.json` at the
root. The command adds `@loomweaver/devkit` as a dev dependency, then runs
`nx g @loomweaver/devkit:distribution` and `:weaver` with the app inferred or named. Alternative:
write sources with the CLI's own recipes and name the registration as a remaining step. Rejected
by the owner on 2026-09-08: a reader who has to register by hand after `init` has not been given
one command.

**Package manager from the lockfile.** `package-lock.json` → npm, `pnpm-lock.yaml` → pnpm,
`yarn.lock` → yarn, `bun.lock` or `bun.lockb` → bun; none → npm, and the output says so. The
install, the served command and the summary are spelled for the manager found. Alternative: an
option only. Kept as an override (`--package-manager`), not as the way to find out.

**What is installed.** `@loomweaver/shell`, `@loomweaver/plugin-sdk`, `@loomweaver/frame-kit`,
`@angular/cdk`, `@jsverse/transloco`, `@ng-icons/heroicons`, and `@angular/service-worker` pinned
to the installed `@angular/core` version; with `--styles tailwind` (the default) also the three
Tailwind packages as dev dependencies. The list is the one Getting started carries today and lives
in one place the docs can be checked against.

**Defaults.** `--title` from the workspace's package name in title case, `--styles tailwind`,
`--weaver notes` with a command on `mod+shift+n`, `--no-weaver` to skip. `--dry-run` prints the
plan in the same shape as the summary. `--force` is passed through to the distribution scaffold and
stays off by default.

**Idempotence by construction.** Every step is already an "ensure present": the install is skipped
for a package the manifest carries at a satisfying range, the scaffolds refuse existing files
without `--force`, the amendments add only what is absent. `init` reports the sum: what it did,
and "nothing left to do" when that is the case.

**The tab group on the site.** A fenced block in `docs/` with the info string `sh npm` is
rendered as a tab group with npm, pnpm, yarn and bun, derived by rule: `npx` becomes `pnpm dlx`,
`yarn dlx`, `bunx`; `npm install` becomes `pnpm add`, `yarn add`, `bun add`; `-D` becomes each
manager's dev flag. The markdown source on GitHub shows the npm form; the site shows four. Rendered
as plain HTML with a radio-input tab pattern in the sync, so the pages stay markdown and no MDX
is introduced. Alternative: Starlight's tab component. Rejected: it needs MDX, and the synced pages
are markdown with braces and angle brackets that MDX would parse.

**The landing page switches to the command only after the release that carries it.** The last
task is conditional on the publish; until then the button stays, because a command that fails on
`npx` is worse than a button.

## Risks / Trade-offs

- **Installing is a side effect the rest of the CLI never had.** → Only `init` installs; the
  trial run names the packages; the summary lists what was installed.
- **The Nx path depends on the collection's generators behaving in a workspace `init` did not
  create.** → The generators already infer the app and refuse ambiguity; `init` inherits that.
- **A package manager's spelling changes.** → The four are named in one table with a test; the
  override option covers a fifth.

## What the build showed

Recorded 2026-09-08 while implementing.

- **The Nx weaver generator did not compose the plugin into the application.** It registered the
  project, set the alias, added the asset glob and the Tailwind source, and left the composition
  root alone, so the generated README's first wiring step fell to the reader. `init`'s Nx scenario
  promises a composed plugin, and the `scaffolding` requirement *A generator composes into what is
  already there* asks for it where the composition root still presents the generated shape. The
  generator now composes through the same recogniser the CLI uses and warns with the exact lines
  when the root has been reshaped. Three generator tests pin it. Until the devkit that carries this
  is published, `init` under Nx installs a devkit that leaves the reader the first README step; the
  local build was verified end to end by installing the packed devkit into the fresh Nx workspace.
- **Exec spelling for local binaries is not the `dlx` spelling.** `pnpm dlx` and `yarn dlx` fetch a
  remote package, and yarn 1 has no `dlx` at all; the Nx generators and `nx serve` are local
  binaries. The command therefore runs them as `npx`, `pnpm exec`, `yarn` and `bunx`. The site's tab
  group keeps the `dlx` forms, because there the package is remote.
- **A fresh `ng new` pins npm in `packageManager`**, so yarn 1 refuses the project until the field
  is removed or Corepack is enabled. Nothing for `init` to do; the lockfile decides, and a yarn user
  creates the app with yarn.
- **An e2e project is an application to Nx.** The workspace template ships `shop-e2e` with
  `projectType: application`; `init` leaves projects whose name ends in `-e2e` out of the
  candidates.
- **The CLI derived the scaffold directory from the working directory, not from the workspace
  root.** Run from a subfolder, or with an absolute `--out` as `init` passes, the directory-bound
  amendments were dropped. It now derives it from the workspace above the target; the
  workspace-root case merged separately as #320 is kept.
- **A trial run's weaver step is planned against the composition root before the distribution
  step has run**, so it reports the plugin as not composable. The output says so in one line.
- pnpm and bun were not installed on the machine that ran this; their spellings are covered by the
  unit tests, npm and yarn by real runs.

## Open Questions

None that change the specs or the approach. The exact wording of the summary is decided when it
is written.
