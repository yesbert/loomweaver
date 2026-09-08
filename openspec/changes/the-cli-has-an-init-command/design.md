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

## Open Questions

None that change the specs or the approach. The exact wording of the summary is decided when it
is written.
