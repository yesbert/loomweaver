## 1. Detection and installing

- [x] 1.1 Workspace detection: Angular CLI application, Nx workspace with its applications, or
      neither; tests for each, including the refusal outside a workspace with the message that
      names what was expected.
- [x] 1.2 Package manager detection from the lockfile with the npm fallback and the
      `--package-manager` override; a table of the four spellings for install, dev install, `dlx`
      and serve, with a test.
- [x] 1.3 The install step: the runtime packages, the service worker pinned to the installed
      Angular version, the style pipeline unless `--styles precompiled`; skipped per package where
      the manifest already satisfies it; tests against a virtual manifest.

## 2. The command

- [x] 2.1 `init` in the Angular CLI path: install, distribution with `--out .`, first weaver into
      `src/<id>`, summary with the serve command; `--title`, `--styles`, `--weaver`, `--no-weaver`,
      `--force`, `--dry-run`.
- [x] 2.2 `init` in the Nx path: the collection installed as a dev dependency, the two generators
      run with the app inferred or named by `--app`, the candidates named when ambiguous, summary
      with `nx serve <app>`.
- [x] 2.3 A second run changes nothing and says so; a trial run names everything and writes and
      installs nothing; tests for both.
- [x] 2.4 Help text and `list` name the command; the `--help` of `init` names every option and its
      default.

## 3. Run it for real

- [x] 3.1 A fresh `ng new` app under `.claude/tests/`: `npx` from the local build, `init`, serve,
      the rail shows the weaver; run twice, the second run reports nothing to do.
- [x] 3.2 A fresh Nx workspace with one Angular application: the same; and one with two
      applications: the refusal that names both. The Nx template ships two applications (api,
      shop) and an e2e project, so the refusal was the first thing seen; with `--app shop` the run
      went through. Composition verified with the packed local devkit, because the published one
      does not compose yet (design, *What the build showed*).
- [x] 3.3 With pnpm and bun lockfiles: the install and the serve command are spelled for them.
      Real run with yarn 1 (`yarn add`, `yarn start`, build green); pnpm and bun are not installed
      on this machine and are covered by the unit tests.

## 4. The documentation and the site

- [x] 4.1 The tab group in `website/tools/sync-docs.mjs`: a fence with info string `sh npm`
      renders as npm, pnpm, yarn and bun tabs by rule, plain HTML, with a unit test on the
      rewriting; a style for the tab group in the site's stylesheet, passing `check-contrast`.
- [x] 4.2 `docs/getting-started.md` opens with `ng new` as the prerequisite and the one command,
      and keeps steps 2 to 4 as the explanation of what it did; `docs/scaffolding.md` documents
      `init` with its options; `docs/building-with-an-assistant.md` quotes the one command where it
      quoted three.
- [x] 4.3 `README.md` quick start, `llms.txt` and `llms-full.txt` carry the one command.
- [x] 4.4 After the release that publishes the CLI with `init`: the landing page's primary action
      becomes the command with the tab group; until then the button stays. Released as 0.9.3 on
      2026-09-08; the hero and the closing section carry the command from that day.

## 5. Verify

- [x] 5.1 `nx run-many -t test lint -p cli devkit` green; `docs-style-check` and
      `docs-format-check` green; `npm run check` in `website/` green.
- [x] 5.2 `openspec validate the-cli-has-an-init-command --strict` passes.
