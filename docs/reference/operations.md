# Operations — what bites, and what it costs

Working knowledge that decays between sessions. **Traps, not run numbers**: each entry below cost
real time at least once, and every one of them fails in a way that looks like something else.

## Running things locally

- **A leftover development server on port 4200 will be adopted by the end-to-end suite.** Playwright
  reuses an existing server, so a whole suite can silently run against a stale build — this produced
  two wrong diagnoses in one session. Either free the port or point the run elsewhere with
  `BASE_URL`. **The demo is the exception**: its own suite is pinned to port 4210 and `BASE_URL`
  moves only the assertion URL, so pointing it elsewhere makes it wait for a server that never
  starts.
- **A `cd` persists across shell invocations**, and a parallel invocation does not see it. Use
  absolute paths; several "the build is green" reports were actually "I was not in the workspace".
- **A pipe after a test command reports the pipe's exit status, not the test's.** `… | tail` has
  reported success for a failed run more than once, and `… | head` has aborted a run mid-way and had
  the abort read as a result. Write full runs to a file and grep the summary line explicitly.
- **Never match on the absence of the word "error".** Match on the success line the tool actually
  prints. An empty output is not a pass.
- **Node scripts resolve their modules relative to the script's own path.** A helper written to
  `/tmp` cannot import the workspace's packages. Put it in the workspace.
- **zsh has a readonly `status` variable**, and does not word-split an unquoted variable. Both have
  produced silent failures.

## Editing

- **Never run Prettier over the Angular template files.** Its HTML parser does not know the control
  flow blocks and flattens their indentation. This has had to be reverted twice.
- **`prettier --write` on a source file also reformats the lines you did not touch, and
  `structure-baseline.json` counts lines.** On 2026-08-26 formatting `workspace.service.ts` for a
  three-line fix rewrapped one unrelated import and took the file from 485 lines to 488, past its
  own baseline entry — `structure-check` fails there, and the failure reads like the fix rather than
  like the formatter. Nothing under `platform/` is prettier-clean anyway (225 files that day) and no
  pipeline step checks it, so format the lines you wrote and leave the rest alone.
- **Take a calibration change back line by line, never with `git checkout <file>`.** Three separate
  sessions lost real edits that way, because the file also held work.
- **A checker you wrote yourself is not evidence until it has been calibrated in both directions** —
  break something on purpose, confirm it is reported, take the break back, confirm the file is
  unchanged. Self-written link checkers in this repository have reported phantom failures at least
  three times, each from a different flaw in how they strip code spans.
- **Vitest does not type-check.** Packaging is the type check; a green test run can sit on code that
  does not compile. It bit again on 2026-08-25: moving a constant and leaving a bare
  `export { X } from './elsewhere'` behind kept 1,288 specs green while `nx package shell` failed
  outright, because a re-export does not bring the name into local scope.
- **A comment inside a template literal is only invisible to the scanner while the template has no
  `${}`.** At a substitution the token ends and a plain scan loop carries on in ordinary code mode,
  so template text after the closing brace gets tokenised as code. Take template spans from the AST.
- **`import type` is not an import at run time.** TypeScript erases it, so a type-only edge cannot
  cause a circular-initialisation bug and does not count as a file cycle. It still counts towards a
  library split, which is why `check-import-cycles.mjs` builds two graphs rather than one.
- **`nx migrate` writes TypeScript compatibility pins into every `tsconfig`** — `esModuleInterop:
  false`, `types: ["*"]`, `noUncheckedSideEffectImports: false`, `ignoreDeprecations: "6.0"` — to
  preserve pre-TS6 behaviour. That assumes a workspace coming from TypeScript 5. This one is already
  on 6, so the pins *change* behaviour instead of preserving it: `esModuleInterop: false` broke the
  CommonJS default import of `dompurify` and turned 13 tests red. Discard them after
  `--run-migrations` with `git checkout HEAD -- '*tsconfig*'`; the files were already correct.
  `migrations.json` and `tools/ai-migrations/` are throwaway artefacts.
- **`@types/node` follows the Node pin in `.nvmrc`, never `latest`.** Its major mirrors the runtime;
  a higher one types APIs that are not there at run time. It moves when the pin moves, not before.
- **Upgrade through `npx nx migrate <version>`, not `npm update`.**
  `scripts/update-all-dependencies.sh` deliberately stays inside the semver ranges and only reports
  the majors that are waiting.

## Verifying

- **Test names in this repository read as scenarios.** They are the most reliable description of
  what the system does, and they are why most requirements rest on tests rather than on prose.
- **The published contract is the packed type declarations, not the source barrels** — the barrels
  export more than ships. Check `platform/dist/**` after packaging.
- **A concordance hit is not a coverage hit.** That a source is listed as dissolved proves only that
  someone opened it.
- **Status lines lie in both directions.** Two documents claimed work was unbuilt that had shipped
  weeks earlier. Check against the code.

## Guards this repository runs

| Command | Where | What it fails on |
|---|---|---|
| `npm run api-docs-check` | `platform/` | a published export mentioned in no documentation |
| `npm run comments-check` | `platform/` | a comment that is neither a functional directive nor JSDoc on something a consumer can reach — reachable in the packed declarations, and not a `private` member, which is emitted as a bare name with nothing callable under it. Needs the packages packed first, all three that ship declarations. Reads comments from the AST: a scan loop gives up part-way through a file whose template literals carry `${}`, which hid 59 comments in 23 files until 2026-08-26. The residue in `tools/comment-residue.json` holds six, all in the `@loomweaver/frame-kit` entry point, with the reason beside the number; it is a ratchet and the checker fails on a stale entry too |
| `npm run import-cycles-check` | `platform/` | a new import cycle between files in `@loomweaver/shell`, or a new mutually dependent pair of feature slices. Baselines in `tools/cycle-baseline.json`, both ratchets: file cycles stand at zero, slice pairs at 21, and the check fails on an entry that is no longer true so the list gets trimmed |
| `npm run package-exports-check` | `platform/` | a package manifest promising a file the package does not ship |
| `npm run region-ids-check` | `platform/` | a shell default aimed at a region no scaffold emits |
| `npm run structure-check` | `platform/` | a folder over 12 concepts or a source file over 400 lines, where a concept is one non-spec `.ts` file. Baseline in `tools/structure-baseline.json`, a ratchet: five folders and ten files are recorded today, and the check fails on a new entry, a worse one, an improved one still over the threshold, and one that no longer applies |
| `npx nx run-many --target=lint --all` | `platform/` | module-boundary violations, member ordering, inline templates, unknown Tailwind utilities |
| `npm run lint` | `demo/`, `website/` | the same conventions in the two products that live outside the Nx workspace |
| `openspec validate --specs --strict` | repo root | a malformed or scenario-less specification |

The end-to-end suite, including the accessibility audit, runs in the nightly rather than in the merge
gate — a standing decision to keep the gate fast.
