> **Status:** approved.

## Why

`@loom/sandbox-kit` was renamed to `@loom/frame-kit`. The rename went through `docs/`, `llms.txt`,
`llms-full.txt`, `README.md` and the served `/frame-kit/` path, but five references survived. One of
them is a build command in `CONTRIBUTING.md` that no longer resolves to an Nx project, so a
contributor who follows the documented setup hits a hard failure. Another sits in
`openspec/config.yaml`, which the OpenSpec skills read on every run, so the wrong package name is
handed to every future change.

Separately, `.claude/CLAUDE.md` — the file loaded into every assistant session — carries three dead
links, names two Nx projects that do not exist, and cites a decision record in violation of the rule
it states two paragraphs earlier. A guide that misdescribes the repository is worse than no guide,
because it is trusted.

Neither problem gets better on its own, and both are cheap to fix now while no other change is in
flight.

## What Changes

- Retire the last five `sandbox-kit` references so the repository names only what exists.
- Correct the three dead links, the two wrong project names and the unresolvable decision-record
  citation in `.claude/CLAUDE.md`.
- Delete leftovers from the working tree: a source-less `sandbox-kit` library directory, two
  throwaway dump scripts, two empty directories and the accumulated `.DS_Store` files.

No published surface, no runtime behaviour and no test outcome changes. `@loom/frame-kit` already
builds, ships and is documented under its current name everywhere that matters; this change only
removes the stragglers that still point at its old one.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This change alters no requirement: the packages, their contents and the paths a distribution
serves are all unchanged. `.openspec.yaml` therefore sets `skip_specs: true`.

## Impact

Documentation and configuration, all by file path:

- `CONTRIBUTING.md` (line 160) — `npx nx bundle sandbox-kit`, a command with no matching Nx project.
- `SECURITY.md` (line 12) — `@loom/sandbox-kit` in the list of packages a reporter should name.
- `openspec/config.yaml` (line 16) — `@loom/sandbox-kit` in the published-package list read by every
  OpenSpec run.
- `.claude/CLAUDE.md` (lines 64, 68, 142) — links to `docs/chronicle.md`,
  `docs/reference/operations.md` and `docs/reference/engineering-standards.md`; all three files live
  under `.claude/docs/`.
- `.claude/CLAUDE.md` (lines 183, 187–188) — the Nx tag examples name `@loom/demo-weaver` and
  `loom-demo`; the workspace carries `testbed-weaver` (`scope:weaver`, `type:app`) and
  `loom-testbed` (`scope:distribution`, `type:app`) instead, and the `demo/` product is an Angular
  application outside the Nx workspace.
- `.claude/CLAUDE.md` (line 188) — cites `ADR-0018 §7`; the decision corpus was dissolved, so the
  number resolves to nothing.

Source, cosmetic only:

- `platform/libs/core/frame-kit/src/build.spec.ts` (lines 6–7) — the suite is named
  `'sandbox-kit build'` and its temporary directory prefix is `lw-sandbox-kit-`.

Working tree, untracked and therefore not part of any commit:

- `platform/libs/core/sandbox-kit/` — holds a `.DS_Store` and a stale `dist/`, no `project.json`,
  no source.
- `platform/.tmp-dump-exports.mjs`, `platform/.tmp-dump2.mjs` — leftover throwaway scripts.
- `platform/platform/`, `platform/libs/core/shell/node_modules/` — empty directories.
- 35 `.DS_Store` files.

Regenerated build artefacts (`dist`, `coverage`, `.angular`, `.nx`, `test-results`,
`playwright-report`, `.astro`, `generated`) are deliberately out of scope: deleting them costs a
rebuild and buys nothing.

This change dissolves no decision record and no prior change; it is the residue of the rename
carried out by the archived change `2026-08-22-frame-plugin-isolation-levels`.
