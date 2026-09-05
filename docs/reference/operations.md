# Operations — what bites, and what it costs

> **This page is about working in this repository**, not about what the platform guarantees. The
> contract is under `openspec/specs/`; this page names the guards that run here and the traps they
> catch.

Working knowledge that decays between sessions. **Traps, not run numbers**: every entry below fails
in a way that looks like something else, which is what makes it expensive.

## Running things locally

- **A leftover development server on port 4200 will be adopted by the end-to-end suite.** Playwright
  reuses an existing server, so a whole suite can silently run against a stale build and its verdict
  is about code it never loaded. Either free the port or point the run elsewhere with `BASE_URL`.
  **The demo is the exception**: its own suite is pinned to port 4210 and `BASE_URL` moves only the
  assertion URL, so pointing it elsewhere makes it wait for a server that never starts.
- **A `cd` persists across shell invocations**, and a parallel invocation does not see it. Use
  absolute paths, because "the build is green" and "I was not in the workspace" look alike from
  outside.
- **A pipe after a test command reports the pipe's exit status, not the test's.** `… | tail` reports
  success for a failed run, and `… | head` aborts the run mid-way, after which the abort reads as a
  result. Write full runs to a file and grep the summary line explicitly.
- **Never match on the absence of the word "error".** Match on the success line the tool actually
  prints. An empty output is not a pass.
- **Node scripts resolve their modules relative to the script's own path.** A helper written to
  `/tmp` cannot import the workspace's packages. Put it in the workspace.
- **zsh has a readonly `status` variable**, and does not word-split an unquoted variable. Both fail
  silently.

## Scaffolding from inside this repository

The generators are published, so a product repository reaches them through `@loomweaver/cli` or the
MCP server. Working in this repository is the one case that does not: the collection is used through
the workspace path alias, and the placement is passed explicitly.

```bash
cd platform
nx g @loomweaver/devkit:weaver --id notes --directory libs/weavers/notes-weaver \
  --import-path @loomweaver/notes-weaver --app loom-testbed
```

To point an MCP client at a local build rather than the published package, bundle it first and name
the bundle:

```bash
cd platform && nx bundle mcp
```

```json
{
  "mcpServers": {
    "loomweaver": { "command": "node", "args": ["platform/libs/tooling/mcp/dist/main.mjs"] }
  }
}
```

## Editing

- **Never run Prettier over the Angular template files.** Its HTML parser does not know the control
  flow blocks and flattens their indentation, and the damage then has to be taken back by hand.
- **`prettier --write` on a source file also reformats the lines you did not touch, and
  `structure-baseline.json` counts lines.** A three-line fix that lets the formatter rewrap one
  unrelated import can carry the file past its own baseline entry, and `structure-check` then fails
  in a way that reads like the fix rather than like the formatter. Nothing under `platform/` is
  prettier-clean anyway, some 225 files, and no pipeline step checks it, so format the lines you
  wrote and leave the rest alone. **Markdown is the exception**: `docs/`, the README and CONTRIBUTING
  are formatted in full, `npm run docs-format-check` holds it, and the root `.prettierrc` keeps the formatter out of the code blocks so a sample's
  density stays the author's decision.
- **Take a calibration change back line by line, never with `git checkout <file>`.** The file also
  holds the work you meant to keep, and the checkout throws it away with the calibration.
- **A checker you wrote yourself is not evidence until it has been calibrated in both directions.**
  Break something on purpose, confirm it is reported, take the break back, confirm the file is
  unchanged. Link checkers written here are the standing example: each one strips code spans its own
  way, and each flaw in that reports failures that are not there.
- **Vitest does not type-check.** Packaging is the type check; a green test run can sit on code that
  does not compile. Moving a constant and leaving a bare `export { X } from './elsewhere'` behind
  keeps the whole suite green while `nx package shell` fails outright, because a re-export does not
  bring the name into local scope.
- **A comment inside a template literal is only invisible to the scanner while the template has no
  `${}`.** At a substitution the token ends and a plain scan loop carries on in ordinary code mode,
  so template text after the closing brace gets tokenised as code. Take template spans from the AST.
- **`import type` is not an import at run time.** TypeScript erases it, so a type-only edge cannot
  cause a circular-initialisation bug and does not count as a file cycle. It still counts towards a
  library split, which is why `check-import-cycles.mjs` builds two graphs rather than one.
- **`nx migrate` writes TypeScript compatibility pins into every `tsconfig`**: `esModuleInterop:
false`, `types: ["*"]`, `noUncheckedSideEffectImports: false` and `ignoreDeprecations: "6.0"`, all
  to preserve pre-TS6 behaviour. That assumes a workspace coming from TypeScript 5. This one is
  already on 6, so the pins _change_ behaviour instead of preserving it: `esModuleInterop: false`
  broke the CommonJS default import of `dompurify` and turned 13 tests red. Discard them after
  `--run-migrations` with `git checkout HEAD -- '*tsconfig*'`; the files were already correct.
  `migrations.json` and `tools/ai-migrations/` are throwaway artefacts.
- **`@types/node` follows the Node pin in `.nvmrc`, never `latest`.** Its major mirrors the runtime;
  a higher one types APIs that are not there at run time. It moves when the pin moves, not before.
- **Upgrade through `npx nx migrate <version>`, not `npm update`.**
  `scripts/update-all-dependencies.sh` deliberately stays inside the semver ranges and only reports
  the majors that are waiting.
- **The tour on the README and the landing page is recorded, not hand-made.** Serve the testbed, then
  `node platform/tools/record-tour.mjs` writes `assets/media/tour-{light,dark}` as webm, mp4, gif and
  a poster still, which is exactly the set `website/tools/sync-docs.mjs` refuses to build without. It
  needs `ffmpeg` on PATH and nothing in CI runs it. Re-record when you change the workbench chrome
  the tour shows, and follow a written route while recording: an outdated tour leaves a broken layout
  on the front page, where it stays until somebody notices.

## Verifying

- **Test names in this repository read as scenarios.** They are the most reliable description of
  what the system does, and they are why most requirements rest on tests rather than on prose.
- **The published contract is the packed type declarations, not the source barrels.** The barrels
  export more than ships. Check `platform/dist/**` after packaging.
- **A concordance hit is not a coverage hit.** That a source is listed as dissolved proves only that
  someone opened it.
- **Status lines lie in both directions.** A document can call work pending that shipped weeks
  earlier, and call work done that never landed. Check against the code.

## Guards this repository runs

| Command                               | Where                            | What it fails on                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run api-docs-check`              | `platform/`                      | a published export mentioned in no documentation                                                                                                                                                                                                                                                                                                                                 |
| `npm run comments-check`              | `platform/`                      | a comment that is neither a functional directive nor JSDoc on something a consumer can reach in the packed declarations, a `private` member being out of reach. Needs the three packages that ship declarations packed first. The residue in `tools/comment-residue.json` names the exceptions with their reason; it is a ratchet, and the checker fails on a stale entry too    |
| `npm run import-cycles-check`         | `platform/`                      | a new import cycle between files in `@loomweaver/shell`, or a new mutually dependent pair of feature slices. Baselines in `tools/cycle-baseline.json`, both ratchets: file cycles stand at zero, slice pairs at 21, and the check fails on an entry that is no longer true so the list gets trimmed                                                                              |
| `npm run package-exports-check`       | `platform/`                      | a package manifest promising a file the package does not ship                                                                                                                                                                                                                                                                                                                    |
| `npm run region-ids-check`            | `platform/`                      | a shell default aimed at a region no scaffold emits, or a scaffolded weaver docked into a region that is not a panel                                                                                                                                                                                                                                                             |
| `npm run docs-style-check`            | `platform/`                      | a documentation page with more sentences over 40 words than `tools/docs-style-baseline.json` records (a ratchet: the number may only go down, and a stale entry fails too), a page under `docs/` without the derived-from-specs header (the index, the glossary and this page are exempt), or a spelling the glossary does not use. `--list` prints every long sentence per page |
| `npm run structure-check`             | `platform/`                      | a folder over 12 concepts or a source file over 400 lines, where a concept is one non-spec `.ts` file. Baseline in `tools/structure-baseline.json`, a ratchet: five folders and ten files are recorded today, and the check fails on a new entry, a worse one, an improved one still over the threshold, and one that no longer applies                                          |
| `npx nx run-many --target=lint --all` | `platform/`                      | module-boundary violations, member ordering, inline templates, unknown Tailwind utilities                                                                                                                                                                                                                                                                                        |
| `npm run lint`                        | `demo/`, `website/`              | the same conventions in the two products that live outside the Nx workspace                                                                                                                                                                                                                                                                                                      |
| `npm run icon-docs-check`             | `platform/`                      | the icon catalogue in `docs/reference/icons.md` no longer matching the shell's icon map; `--write` regenerates it                                                                                                                                                                                                                                                                |
| `npm run agent-versions-check`        | `platform/`                      | the two agent packages the weaver generator emits as literals drifting from the versions the workspace installs                                                                                                                                                                                                                                                                  |
| `npm run command-names-check`         | `platform/`                      | two shipped commands presenting the same name to a user, or one command labelled two ways                                                                                                                                                                                                                                                                                        |
| `npm run pwa-check`                   | `demo/`                          | a promise the product makes to the browser and never to itself: the manifest, the icons and the service worker it advertises                                                                                                                                                                                                                                                     |
| `npm run licence-check`               | `platform/`, `demo/`, `website/` | a production dependency under a licence outside the allow-list                                                                                                                                                                                                                                                                                                                   |
| `shellcheck scripts/*.sh`             | repo root                        | a shell script warning                                                                                                                                                                                                                                                                                                                                                           |
| `npm run quick-start-check`           | `platform/`, nightly             | the Getting started commands no longer producing a running, tested product against the published packages: two weavers composed in, built, and the generated tests run                                                                                                                                                                                                           |

`openspec validate --all --strict` is run by hand before a change is handed over; no pipeline runs it.

The end-to-end suite, including the accessibility audit, runs in the nightly rather than in the merge
gate, which is a standing decision to keep the gate fast.

Two gates in the merge run against the pull request rather than against the tree, so there is no
local command for them. **Sign-off** fails when a commit in the branch carries no `Signed-off-by`
line naming its own author; the DCO section of `CONTRIBUTING.md` says what that line states and how
to add it to commits already written. Copilot reviews every pull request automatically, which blocks
nothing by itself, but `main` requires conversation resolution, so a thread it opens holds the merge
until someone answers it.
