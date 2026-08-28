> **Status:** approved.

## Why

LoomWeaver is meant to be used and extended by people outside this company, and that only works
where they can open a pull request, see it build, and read why the platform is shaped the way it is.
Azure DevOps cannot offer them any of that. The earlier plan kept Azure as the source and pushed a
filtered mirror to GitHub, which buys visibility but not participation: a mirror takes no pull
requests, so the contribution the whole exercise is for cannot arrive.

So GitHub becomes the only source. Everything that follows is a consequence of that one decision.

One prerequisite is already separate: `the-scope-is-loomweaver` renames the packages, because `loom`
was unavailable on npm. It lands before this change does.

## What Changes

- **BREAKING for the maintainer's workflow:** `https://github.com/yesbert/loomweaver` becomes the
  only repository. The Azure repository is frozen read-only as a history archive and its pipelines
  are switched off. The new repository starts from a single initial commit; the 1,590 commits of
  history stay behind on Azure and are not migrated.
- **`.claude/` leaves the repository.** It is ignored in full and lives in a private collection
  repository, linked into the working copy by symlink. A `link.sh` there takes the target project
  directory as an argument, because it differs per machine.
- **The backfill archive is not published.** The 29 changes the OpenSpec backfill generated in
  August 2026 are summaries of decision records produced in one pass and never reviewed line by
  line. They move to the private archive. The changes written since then carry hand-written design
  notes and are published with the repository, unedited, with a `README.md` saying that they name
  the scope and the paths of their own time.
- **`docs/decisions/` is dissolved.** Its concordance table links into the archive that is no longer
  published, so it would become 63 dead links. The reasoning it points at is not rewritten into a
  new document; it is preserved privately, and the handful of rules that read as arbitrary without a
  reason get one sentence each, next to the rule.
- **The public tree stops pointing at internals.** The engineering standards and the operations
  reference move out of `.claude/` into `docs/reference/`, and `openspec/config.yaml` points at
  their new home. An outside contributor must be able to read the rules their pull request is judged
  against.
- **Everything moves to GitHub Actions**: the build gate, the nightly end-to-end suite, SonarQube
  analysis and the deployment of `loomweaver.dev`. The Azure pipeline definitions are removed.
- **Packages are published to npm** under the public `@loomweaver` scope instead of the private Azure
  Artifacts feed, released from Actions through trusted publishing so no long-lived token is stored
  in the repository. `demo/.npmrc` and the feed authentication in the deployment disappear with it.
- **Authorship is corrected.** The published packages and the `NOTICE` name `Norbert Rosenwinkel`,
  not `Crosslabs GmbH`. The packages gain `repository`, `homepage` and `bugs`, and carry no e-mail
  address: the existing role addresses and the issue tracker remain the only contact paths.

## Capabilities

### New Capabilities

None. Nothing the platform guarantees changes.

### Modified Capabilities

None. Where the platform is developed, how it is built and where its packages are published are not
observable properties of the platform, and no capability states them. The change therefore declares
`skip_specs: true`.

## Impact

Dissolved by this change, each named so it stays discoverable afterwards:

- `docs/decisions/README.md` — the concordance of the 63 dissolved decision records; deleted, its
  content preserved privately rather than rewritten.
- `docs/decisions/0013-ai-facing-docs-llms-txt.md` — a documentation policy; its rule moves next to
  where it takes effect.
- `docs/decisions/0049-open-source-release-github-npmjs.md` — describes the mirror model this change
  overturns; replaced by this change.
- every `openspec/changes/archive/*backfill*` directory and `2026-08-18-adopt-openspec` (29
  directories) — moved to the private archive, not published.
- `azure-pipelines-build.yml`, `azure-pipelines-nightly.yml`, `azure-pipelines-sonar.yml`,
  `azure-pipelines-publish.yml`, `azure-pipelines-deploy.yml` — replaced by GitHub Actions
  workflows.
- `demo/.npmrc` — existed only to authenticate against the Azure Artifacts feed.

Also affected:

- The seven published `package.json` files under `platform/libs/`: registry, authorship, repository
  metadata.
- `NOTICE`, `CONTRIBUTING.md`, `SECURITY.md` and `README.md`: contribution path, badges and contact
  wording follow GitHub.
- `.gitignore`: ignores `.claude/` as a whole rather than two paths inside it.
- `openspec/config.yaml`: the pointer to the engineering standards.
- `openspec/changes/archive/README.md`: new, explaining what the published records are and are not.
- The Azure repository, the Azure Artifacts feed and the five registered pipelines: retired, not
  deleted.
