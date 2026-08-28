## 1. Prerequisites

- [x] 1.1 Confirm that `the-scope-is-loomweaver` has been merged and that the workspace, the
      scaffolding and the demo build under the `@loomweaver` scope. Everything below assumes it.
- [x] 1.2 Create the private collection repository in the DevTooling project and move this project's
      `.claude/` tree into it as its own directory, with `settings.local.json` ignored there.
- [x] 1.3 Add `link.sh` to that repository: first argument the directory in the collection, second
      the project directory on this machine; creates an absolute symlink, refuses to overwrite an
      existing real `.claude`, and reports a missing `.gitignore` entry.
- [x] 1.4 Link this machine and verify the assistant still reads the project instructions and the
      skills through the symlink.
- [x] 1.5 Widen the `.gitignore` entry from `.claude/worktrees` and `.claude/settings.local.json` to
      `.claude/` as a whole, and confirm `git status` reports a clean tree.

## 2. The archive split

- [x] 2.1 Recover the 63 decision records from the commit preceding `d46c5452` and store them in the
      private collection repository under an archive directory.
- [x] 2.2 Move the 29 backfill changes (every `backfill-*` directory plus `2026-08-18-adopt-openspec`)
      from `openspec/changes/archive/` into that same private archive, and confirm the rest remain.
- [x] 2.3 Leave the remaining archived changes exactly as written, and add a short `README.md` to
      `openspec/changes/archive/` saying what a reader is looking at: dated records that name the
      scope, the paths and the decision numbers of their own time, some of them referring to
      backfill changes that are not published here.
- [x] 2.4 Run `openspec list` and `openspec validate --all --strict` and confirm both still pass with
      the reduced archive.

## 3. Dissolve the internal references in the public tree

- [x] 3.1 Repoint `openspec/config.yaml` at `CONTRIBUTING.md`, which already carries the conventions
      in full and in English. `engineering-standards.md` stays private: it is written to us, in
      German, with dates and precipitating cases, and translating it would publish internals to say
      what CONTRIBUTING already says.
- [x] 3.2 Split `operations.md`: the traps, the editing rules, the verification notes and the guard
      table go to `docs/reference/operations.md`, linked from the docs index, the site sidebar and
      CONTRIBUTING. The release mechanics stay private as `releasing.md` and are rewritten for
      GitHub Actions and npm when those workflows exist.
- [x] 3.3 Add one sentence of reasoning beside each rule that reads as arbitrary without it: no
      comments in source, no inline templates, semantic tokens only, no module federation, no server
      in this repository. Put them where the rule is stated, not in a document of their own.
- [x] 3.4 Fold the surviving rule of `docs/decisions/0013-ai-facing-docs-llms-txt.md` (`llms.txt`
      stays a curated map, not a documentation dump) into the documentation policy it governs, then
      delete the record.
- [x] 3.5 Delete `docs/decisions/README.md` and `docs/decisions/0049-open-source-release-github-npmjs.md`,
      and remove the `docs/decisions/` directory.
- [x] 3.6 Sweep the whole public tree for remaining pointers into `.claude/`, for Azure DevOps
      addresses, for the `crosslabs-gmbh` organisation and for decision-record citations, and resolve
      every hit.

## 4. Package and repository metadata

- [x] 4.1 In all seven `package.json` files under `platform/libs/`, replace
      `publishConfig.registry` with `publishConfig.access: "public"`.
- [x] 4.2 Set `"author": "Norbert Rosenwinkel (https://loomweaver.dev)"` in the same seven files, and
      add `homepage`, `bugs` pointing at the GitHub issues, and `repository` pointing at
      `https://github.com/yesbert/loomweaver` with the package's own directory.
- [x] 4.3 Rewrite `NOTICE` to name `Norbert Rosenwinkel` in both lines, and correct the mention in
      `platform/libs/integrations/ag-ui/README.md`, which npm renders on the package page.
- [x] 4.4 Delete `demo/.npmrc` and remove the feed authentication it existed for, so the demo
      installs the public packages. This waits for the first npm release: until the packages exist
      there, removing the feed mapping breaks the demo build. Six documents say the packages are not
      public yet and name the feed — `README.md`, `demo/README.md`, `docs/getting-started.md`,
      `docs/scaffolding.md`, `llms-full.txt` and `platform/libs/tooling/mcp/README.md`. They stop
      being true at the same moment and are corrected in the same pull request.

## 5. Contributor-facing documents

A full consistency pass over the documentation, not only over the four files this group names. It
found the package count wrong in six places (four, six and seven all claimed), five installation
hints still naming the old scope without its slash, and two tests that the rename had silenced.

- [x] 5.1 Rewrite the contribution path in `CONTRIBUTING.md` for GitHub: fork, branch, pull request,
      the checks that must pass, and the OpenSpec rule for when a change is required.
- [x] 5.2 Update `README.md` for the new home: how work happens here, the missing seventh package,
      the current state of the demo. The build badge waits for the workflow it would point at.
- [x] 5.3 Check `SECURITY.md` against GitHub's private vulnerability reporting and name it as a path
      beside the existing role address.
- [x] 5.4 Confirm the issue templates and the pull-request template under `.github/` still fit the
      GitHub flow, and add a repository description and topics.

## 6. GitHub Actions workflows

- [x] 6.1 Write the build gate workflow from `azure-pipelines-build.yml`: shell lint, Nx lint, test,
      build, packaging of the seven libraries, production-dependency licence check. `push` on `main`
      and `pull_request` only, with concurrency cancelling superseded runs.
- [x] 6.2 Write the nightly workflow from `azure-pipelines-nightly.yml`: schedule and manual dispatch
      only, running the Playwright suite and the demo smoke suite.
- [x] 6.3 Write the SonarQube workflow from `azure-pipelines-sonar.yml`: schedule and `main` only,
      server address as a variable and the token as a secret, with no analysis on fork pull requests.
- [x] 6.4 Write the release workflow from `azure-pipelines-publish.yml`: version tags only,
      publishing the seven packages to npm through trusted publishing, in an environment with a
      required reviewer.
- [x] 6.5 Write the deployment workflow from `azure-pipelines-deploy.yml`: the site to the domain
      root and the demo to its subdomain, deploy key as an environment secret, no npm authentication.
- [x] 6.6 Verify across all five that no workflow uses `pull_request_target` or `workflow_run`, that
      none requests a self-hosted runner, that every `permissions` block is explicit and minimal, and
      that third-party actions are pinned.
- [x] 6.7 Update `scripts/bump-version.sh` and the release documentation for the tag-driven GitHub
      release path.
- [x] 6.8 Leave the five `azure-pipelines-*.yml` files where they are and omit them from the export
      instead. A pull request that deletes them cannot be gated: the build would have to run from a
      merge commit in which its own definition no longer exists, so it queues forever. They stay in
      the frozen Azure repository, which is where they belong, and never reach GitHub.

## 7. The cut

- [x] 7.1 Switch `yesbert/loomweaver` to private for the setup.
- [x] 7.2 Run the internal-marker sweep against the exact tree that will be pushed, not against the
      working copy.
- [x] 7.3 Push that tree to `main` as a single initial commit.
- [x] 7.4 Add the build badge to `README.md`, now that there is a workflow to point at.
- [x] 7.5 Configure branch protection on `main`: required checks, required pull request, no direct
      pushes. The three gate jobs are required, admins included, force pushes and deletion refused.
      Verified by pushing an empty commit straight at `main`: `protected branch hook declined`.
- [x] 7.6 Configure the secrets and the environments: Sonar token, deploy key, and the npm trusted
      publisher. The required reviewer is deliberately not set: with one maintainer it is a button
      you press on yourself a minute after triggering the run, and GitHub's "prevent self-review"
      would make a release impossible. What the environments got instead is the rule a reviewer was
      meant to stand in for, in a form that needs no click: `release` accepts only tags matching
      `v*`, `production` only `main`, and `production` waits five minutes so a mistaken deploy can
      be cancelled. Verified by dispatching the deploy from a scratch branch: `Branch
      "test/the-policy-refuses-a-branch" is not allowed to deploy to production due to environment
      protection rules.` A human reviewer becomes worth having when a second person holds write
      access.
- [x] 7.7 Restrict which actions may run, and confirm that fork pull requests need approval before a
      workflow starts. Only GitHub-owned actions and the pinned Sonar scanner may run; every fork
      pull request from an outside contributor waits for approval, not just a first-time one.

## 8. Prove the chain

- [x] 8.1 Open a throwaway pull request and confirm the build gate runs and reports. The demo job
      fails until the packages are on npm, because it installs them from a registry — so run 8.4
      before judging it.
- [x] 8.2 Trigger the nightly workflow manually and confirm the end-to-end suites run.
- [x] 8.3 Trigger the Sonar workflow and confirm the server receives the analysis.
- [x] 8.4 Tag a release and confirm all seven packages appear on npm with provenance, under the
      correct author and repository.
- [x] 8.5 Confirm the site and the demo deploy, and that the demo installs the public packages.

## 9. Open it

- [x] 9.1 Switch the repository to public.
- [ ] 9.2 Freeze the Azure repository read-only and unregister its five pipelines.
- [x] 9.3 Point the website and any remaining reference at the GitHub repository and the npm packages.
      The site header carries a GitHub link; the two comments naming an Azure pipeline name the
      workflow that replaced it; `scripts/ci/export-sonarqube-results.sh` is deleted, since it
      existed to upload a build tab that no longer exists.
- [x] 9.4 Record the move in `docs/chronicle.md`. Not as a new entry: the chronicle was frozen on
      2026-08-18 and says so in its own first lines. It went where the scope rename went, into the
      preamble, saying that a four-digit pull request number below means the frozen Azure repository
      and that the GitHub count starts at 1.
