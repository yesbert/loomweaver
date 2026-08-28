## 1. Retire the stale package name

- [x] 1.1 `CONTRIBUTING.md` line 160: replace `npx nx bundle sandbox-kit` with
      `npx nx bundle frame-kit`. Verify by running the whole documented block and confirming all six
      packages build.
- [x] 1.2 `SECURITY.md` line 12: replace `@loom/sandbox-kit` with `@loom/frame-kit`. Verify the
      package list matches the six names in `README.md` and `docs/architecture.md`.
- [x] 1.3 `openspec/config.yaml` line 16: replace `@loom/sandbox-kit` with `@loom/frame-kit` and
      reword its description to match how the package is described in `llms.txt` ("static UI assets
      for sandboxed plugins"). Verify with `openspec validate --all --strict`.
- [x] 1.4 `platform/libs/core/frame-kit/src/build.spec.ts` lines 6–7: rename the suite to
      `'frame-kit build'` and the temp-dir prefix to `lw-frame-kit-`. Verify with
      `npx nx test frame-kit`.
- [x] 1.5 Confirm the remaining `sandbox-kit` hits are history only: every match of
      `grep -rn "sandbox-kit"` outside `node_modules` and `dist` lies under
      `openspec/changes/archive/`, `.claude/docs/chronicle.md` or `.claude/docs/roadmap/`.

## 2. Make CLAUDE.md describe this repository

- [x] 2.1 **Withdrawn — the finding was wrong.** The three links were checked from the repository
      root; a relative Markdown link resolves against its own file's directory, which is `.claude/`.
      From there `docs/chronicle.md`, `docs/reference/operations.md` and
      `docs/reference/engineering-standards.md` all exist. No link in `CLAUDE.md` is dead; 2.4
      verifies that mechanically.
- [x] 2.2 Replace the Nx tag examples on lines 183 and 187–188 with the projects that actually carry
      those tags, read from the workspace: `testbed-weaver` for `scope:weaver`, `loom-testbed` for
      `scope:distribution`, `loom-shell` for the bare platform distribution. Name the `demo/`
      product as an Angular application outside the Nx workspace.
- [x] 2.3 Remove the `ADR-0018 §7` citation on line 188, keeping the statement it annotated.
- [x] 2.4 Verify every relative link in `.claude/CLAUDE.md` resolves to an existing path, and that
      every project name it mentions appears in `npx nx show projects` or is explicitly described as
      living outside the workspace.
- [x] 2.5 Confirm `.claude/CLAUDE.md` remains German and that no file edited in section 1 contains
      German text — everything crossing the mirror is English.

## 3. Clear the working tree

- [x] 3.1 Confirm `platform/libs/core/sandbox-kit/` is dead before deleting it: it has no
      `project.json`, and `npx nx show projects` does not list it. Then delete the directory.
- [x] 3.2 Delete `platform/.tmp-dump-exports.mjs` and `platform/.tmp-dump2.mjs`.
- [x] 3.3 Delete the empty directory `platform/platform/`.
      `platform/libs/core/shell/node_modules/` is **not** empty: it holds ng-packagr's build cache
      (`.cache/ng-packagr/`, `.vite/`), which design.md excludes as a regenerated artefact. Left in
      place.
- [x] 3.4 Delete every `.DS_Store` outside `node_modules`, scoped to exactly that filename.
- [x] 3.5 Confirm the deletions produced no tracked change: `git status --short` shows only the
      edits from sections 1 and 2, and no build artefact directory was removed.

## 4. Verify

- [x] 4.1 `npx nx run-many --target=lint --target=test --all` is green in `platform/`.
- [x] 4.2 `openspec validate --all --strict` passes.
- [x] 4.3 The six packages build via the block in `CONTRIBUTING.md`, followed by
      `npm run package-exports-check`.
