## Context

See proposal.md for motivation.

The direction was first written down as ADR-0049 (accepted 2026-08-02) and then immediately softened
by its own addendum of the same day: Azure would stay primary and a filtered squash mirror would go
to GitHub, with the GitHub-first flip deferred to a phase 2 that never came. Nothing was implemented
under either reading, so this change is the first execution and it takes the original §1 and §2 while
dropping the addendum and replacing §3.

Verified starting position (2026-08-27), which differs from what ADR-0049 recorded:

- The repository holds 1,590 commits. `.claude/` is 1.0 MB and tracked; `.gitignore` excludes only
  `.claude/worktrees` and `.claude/settings.local.json`.
- `https://github.com/yesbert/loomweaver` exists since 2026-08-02, is public, and is empty. Its
  default branch is `main`. The maintainer's `gh` CLI is authenticated with the `workflow` scope.
- Seven packages are published, not four or six: `plugin-sdk`, `shell`, `frame-kit`, `devkit`, `cli`,
  `mcp` and `ag-ui`. All seven carry `publishConfig.registry` pointing at the private Azure feed,
  `"author": "Crosslabs GmbH"`, and none carries `repository`.
- The scope they carry is being renamed by a separate change. `loom` was unavailable as an npm
  organisation; `loomweaver` was secured on 2026-08-27, and `the-scope-is-loomweaver` moves all seven
  packages, the internal aliases and the two command-line names onto it. That change lands first, so
  everything below assumes the new scope.
- The OpenSpec archive holds 63 changes: 29 produced by the backfill (every `backfill-*` directory
  plus `2026-08-18-adopt-openspec`) and 34 written since, the newest being the scope rename. The 34
  carry stale references by design: `.claude/` paths, one pointer at a backfill change, and
  decision-record numbers.
- `docs/decisions/` holds a concordance README linking 63 rows into the archive, plus two surviving
  records: ADR-0013 and ADR-0049.
- `engineering-standards.md` and `operations.md` exist only under `.claude/docs/reference/`, and
  `openspec/config.yaml` points at the first of them by that path.
- The SonarQube server is reachable from the internet. `SECURITY.md` and `CODE_OF_CONDUCT.md`
  already carry role addresses; no personal address appears anywhere in the public tree.

## Goals / Non-Goals

**Goals:**

- One repository an outsider can fork, build and open a pull request against, with visible checks.
- Nothing internal in the public tree, and nothing in the public tree pointing at something an
  outsider cannot read.
- The reasoning behind the platform stays available to the maintainer even though it is not
  published, and stays readable on every machine.
- A release path from tag to npm that stores no long-lived credential.

**Non-Goals:**

- Preserving blame or commit history in the public repository.
- Rewriting the dissolved decision records into a public rationale document.
- Migrating anything that is not the platform itself: the demo, the website and the docs move with
  the repository, nothing else does.
- Transferring the repository to an organisation. Authorship is personal, so the personal account is
  consistent; a transfer stays possible later and GitHub redirects the old address.

## Decisions

### 1. GitHub is the only source, and there is no mirror phase

Development happens in the open. The Azure repository is frozen read-only and keeps exactly one job,
holding the history.

Rejected, from ADR-0049 §1: Azure primary with a read-only GitHub mirror. Cheaper to migrate, but a
mirror cannot receive a pull request, and participation is the entire reason for moving.

Rejected, the ADR-0049 addendum: mirror first, flip later. A phased model means paying for two
setups and living with a filtered export pipeline in between, for a phase whose only purpose is to
delay the phase that matters. Six months of evidence say phase 2 does not arrive on its own.

### 2. A fresh history, with the old one archived rather than filtered

The public repository starts from one initial commit at the current state. Public tags begin with
the first public release.

Rejected, from ADR-0049 §2: `git filter-repo` over the full history to strip `.claude/` from every
revision. It would preserve blame, but it demands auditing 1,590 commits and their messages for
internals, and one missed commit is public forever. The benefit does not justify the residual risk.

Consequence accepted: `docs/chronicle.md` remains the only account of what shipped when, and the
first public commit has no ancestry. That is normal for a repository opened at a given moment.

### 3. `.claude/` lives in a per-machine symlink to a shared private collection repository

The directory is ignored in full by the public repository. Its content lives in one private
repository in the DevTooling project that holds the `.claude/` tree of every project of the
maintainer, one directory each, and is linked into each working copy by an absolute symlink. A
`link.sh` in that repository takes the project directory as its first argument, because the path
differs per machine, refuses to overwrite an existing real `.claude`, and reports a missing
`.gitignore` entry.

This replaces ADR-0049 §3, which called for one private repository per project, cloned in place. The
reason for the change is scale: with four projects, one clone and one push beat four of each, and
the shared repository is also where a skill that has outgrown one project is parked before it is
promoted to the existing shared skills repository.

Rejected: a git submodule. `.gitmodules` would leave a private URL in the public repository and
break `git clone --recursive` for outsiders. This was already rejected in ADR-0049 and still holds.

Rejected: a nested clone per project (ADR-0049 §3 as written). It avoids the symlink entirely and is
marginally more robust, but multiplies the number of repositories by the number of projects.

Accepted costs: the symlink is not itself version-controlled, so it must be created once per machine
by `link.sh`; a git worktree of the project does not carry it; and `settings.local.json` must be
ignored inside the private repository, or the machines fight over it.

### 4. The backfill archive is preserved privately, not published and not rewritten

The 30 backfill changes move to the private archive; the 33 later ones are published. Alongside
them, the 63 original decision records are recovered from the commit preceding `d46c5452`, which
deleted them on 2026-08-19, and archived too.

The reason for recovering the originals rather than only the backfill output: the backfill design
notes are one-pass summaries of those records. Distilling them again into a public document would be
a summary of a summary, losing accuracy at every round. If the reasoning is ever needed, the source
is what is wanted.

Rejected: publishing the archive whole. It is only 1.8 MB, but it is unreviewed generated prose that
would become the first thing an outsider reads about how decisions are made here.

The records that stay are not edited to match today's names. This repository already decided that in
`2026-08-26-repo-hygiene-and-doc-truth`: nothing under `openspec/changes/archive/` is touched,
however many stale names it carries, because a dated record that has been corrected no longer says
what was true when it was written. What the published archive gains instead is a short `README.md`
explaining what a reader is looking at, including why some of it points at changes that are not
there.

Rejected: writing a public rationale document covering all 63 decisions. It was considered and
dropped after establishing what the reasoning is actually needed for. It is needed in two
situations: when an existing guarantee is questioned, and when a spec and the code disagree and one
of them must be declared the defect. Both are rare and both are answered by consulting the archive,
which the maintainer and the assistant can both read as long as it sits on disk. What an outsider
needs is not 63 histories but a reason for the handful of rules that look arbitrary, and those
belong next to the rule.

### 5. Public rules live in the public tree

`operations.md` splits. What a contributor needs — the traps, the editing rules, the verification
notes, the table of guards — becomes `docs/reference/operations.md`. The release mechanics stay
private, because they name a feed, an Azure resource id and the rule that a release waits for the
maintainer's word.

`engineering-standards.md` stays private too, which is a correction to the first plan. It was
written to us rather than to a reader: German, dated, and argued from the cases that provoked each
rule. `CONTRIBUTING.md` has carried the same conventions in English all along, deliberately, so
`openspec/config.yaml` points there instead of at a path outside the public tree. Translating the
long form would have published internals in order to say what the short form already says.

The rule that reads as arbitrary without a reason gets one sentence beside it rather than a document
of its own: no comments in source, no inline templates, semantic tokens only, no module federation,
no server in this repository. `docs/architecture.md` already carries the reasoning for the large
lines and is not duplicated.

ADR-0013 (accepted 2026-07-03) is dissolved the same way. Its decision was that `llms.txt` is a
curated map rather than a documentation dump, adopted in phases because the standard is
website-oriented and the project had no site at the time; `llms-full.txt` was deferred until there
were enough clean pages to justify it. Both files now exist and `loomweaver.dev` is live, so the
open part of the decision is closed. The rule that survives is that `llms.txt` stays curated, and it
moves next to the documentation policy it governs.

### 6. Every pipeline becomes a GitHub Actions workflow

Build gate, nightly end-to-end, SonarQube and the deployment of `loomweaver.dev` all move. Actions
minutes are free for public repositories, so the nightly Playwright run costs nothing.

Three rules govern the workflows, and they exist because the repository is public:

- Only the `pull_request` trigger is used for anything a fork can start. A fork's run gets no secrets
  and a read-only token, so a hostile pull request that rewrites a workflow file cannot reach the
  Sonar token, the deploy key or the npm identity.
- `pull_request_target` and `workflow_run` are not used at all. They execute in the base repository's
  context with access to secrets, and they are the standard way public repositories get compromised.
- No self-hosted runners. They would execute a stranger's pull-request code on the maintainer's
  machine. This is why the SonarQube server being internet-reachable matters: a hosted runner can
  analyse it, and no self-hosted runner is needed.

Deployment and publishing run in an environment with a required reviewer, so neither an accident nor
a compromised dependency can ship unattended.

Consequence accepted: fork pull requests get no Sonar analysis, because they get no token. This
changes nothing, since Sonar runs on a schedule today and not per pull request.

### 7. npm, with trusted publishing

The seven packages publish to the public `@loomweaver` scope. `publishConfig.registry` is replaced by
`publishConfig.access: "public"`, without which npm refuses a scoped package on a free plan. The
release workflow authenticates to npm over OIDC, so no token is stored in the repository and the
packages carry verifiable provenance. `demo/.npmrc` is deleted and the deployment loses its feed
authentication, because the demo then consumes what everyone else consumes.

Rejected: an npm automation token in a repository secret. It works, but it is a long-lived
credential in a public repository's settings, and trusted publishing removes the need for one.

### 8. Authorship is personal, and no address is published

The packages and the `NOTICE` name `Norbert Rosenwinkel`, matching the git author of the history and
therefore consistent across commits, packages and copyright. `author` carries the project site and
no e-mail address: a published npm version is immutable, so an address in it is permanent, and the
role addresses in `SECURITY.md` and `CODE_OF_CONDUCT.md` plus the issue tracker already cover every
path a reader might need.

### 9. Clean up in the old repository, cut afterwards

Every content change happens on Azure first, through the normal branch-and-pull-request rhythm with
the existing build gate. Only when the tree is clean does the export happen, and it is then a copy
of a reviewed state rather than a rescue operation in a repository without history or CI.

The single exception is the workflow files themselves. They can be written beforehand but only run
after the cut.

Rejected: exporting first and cleaning up in the new repository. Every mistake would then be made in
a repository with no history to fall back on and no working pipeline to catch it.

## Risks / Trade-offs

- **The rename has not landed when the export happens** → The first public commit would then
  advertise a scope that is not ours. `the-scope-is-loomweaver` is a prerequisite of this change and
  is verified as merged before the cut, not assumed.
- **Something internal slips into the first public commit** → The initial commit is prepared while
  the repository is private, and a sweep for internal markers runs against the exact tree that will
  be pushed, not against the working copy.
- **The history is genuinely gone from daily reach** → It is not deleted, only remote. The Azure
  repository is frozen rather than removed, and the material that is actually consulted, the decision
  records and the backfill archive, is copied onto disk in the private collection repository.
- **A machine without the symlink looks like a project without instructions** → `link.sh` is part of
  the private repository and the setup is a single command; the failure is loud rather than subtle,
  since the assistant reports missing project instructions immediately.
- **Workflows behave differently than the Azure pipelines** → The cut is only declared done after one
  full pass on GitHub: gate green, nightly green, Sonar reporting, a release published to npm and the
  site deployed. Until then the Azure pipelines stay registered and can be re-enabled.
- **The public repository is already visible while it is being set up** → It is switched to private
  for the setup and back to public once the chain is green. It is empty and unreferenced today, so
  nothing is lost by doing so.

## Migration Plan

1. **Prerequisites, independent of everything else.** Land `the-scope-is-loomweaver`. Extract `.claude/`
   into the private collection repository, add `link.sh`, link this machine, verify the assistant
   still reads the project instructions.
2. **Clean up on Azure**, as ordinary pull requests: dissolve `docs/decisions/`, move the standards
   into `docs/reference/` and repoint `openspec/config.yaml`, add the reason sentences, move the 30
   backfill changes and the recovered decision records into the private archive, correct the 33
   published ones, rewrite the package metadata, bring `CONTRIBUTING.md` and `README.md` onto the
   GitHub path, widen the `.gitignore` entry, delete `demo/.npmrc`, and add the workflow files.
   Remove the Azure pipeline definitions last, in the same pull request that is exported.
3. **The cut.** Switch the GitHub repository to private, push the reviewed tree as one initial
   commit, configure branch protection, secrets, environments and trusted publishing.
4. **Prove the chain.** One full pass of every workflow, ending in a released version on npm and a
   deployed site.
5. **Open it.** Switch the repository to public, freeze the Azure repository read-only, unregister
   its pipelines, and point the website and the packages at the new home.

**Rollback.** Until step 5 the Azure repository is still the working one and nothing is lost by
abandoning the attempt. After step 5 the rollback is to re-enable the Azure pipelines and keep
working there; what cannot be undone is the publication itself, which is why the sweep in step 3
happens against the exact tree that gets pushed.
