## 1. Create the foundation slice

- [x] 1.1 Create `platform/libs/core/shell/src/lib/foundation/` and move `shell-features.ts` into it,
      rewriting every importer with a TypeScript parser over import specifiers, never a regular
      expression over source text.
- [x] 1.2 Move `plugin/identified.ts`.
- [x] 1.3 Move `regions/rail/rail-item.ts` and `regions/bar/bar-item.ts`.
- [x] 1.4 Move `plugin/plugin-isolation-level.ts` whole, type and service together.
- [x] 1.5 Leave no re-export behind at any old location. A symbol reachable by two paths is what this
      series has already had to undo once.
- [x] 1.6 Each move resolved exactly the predicted pairs: 31 → 25 after 1.1 (the six `(root)` pairs,
      including `commands` and `diagnostics`), → 24 after 1.2, → 22 after 1.3, → 21 after 1.4. The
      rewrite touched 60 import specifiers across 55 files, all through the TypeScript parser.

## 2. Keep it a foundation

- [x] 2.1 Add a `no-restricted-imports` rule in `platform/libs/core/shell/eslint.config.mjs` that
      forbids `foundation/**` from importing any sibling slice.
- [x] 2.2 Prove it bites: add an import from `foundation/` into a feature slice, confirm lint fails,
      remove it, confirm lint is green.
- [x] 2.3 Write the membership rule into `.claude/docs/reference/engineering-standards.md` beside
      `persistence/` and `elements/`: a module belongs in `foundation/` when every slice may read it
      **and** no slice owns it. State that a service holding feature state does not qualify.

## 3. Trim the ratchet

- [x] 3.1 Baseline refreshed: 0 file cycles, 21 mutual slice pairs.
- [x] 3.4 The comment residue is keyed by file path, so the entry for `plugin-isolation-level.ts`
      moved with the file. Total unchanged at 61 comments in 33 files. Worth knowing: a path-keyed
      residue needs updating on every file move, which is a visible one-line edit rather than a
      silent drift.
- [x] 3.2 Confirm the checker fails if the baseline is left at 31, which is what proves the ratchet
      is doing its job rather than being rewritten silently.
- [x] 3.3 Update the guards row in `.claude/docs/reference/operations.md` to the new number.

## 4. Prove the published surface is untouched

- [x] 4.1 Package the shell and `plugin-sdk` from a `main` worktree and from this branch.
- [x] 4.2 Stronger than required: **both packed declaration sets are byte-identical to `main`**,
      `@loom/plugin-sdk` and `loom-shell.d.ts` alike. Moving declarations between files changes
      nothing the compiler emits.
- [x] 4.3 Package before trusting the suite — Vitest does not type-check, and a broken re-export has
      already passed 1,288 green specs once in this series.
- [x] 4.4 `npm run api-docs-check`, `package-exports-check` and `comments-check` are green.

## 5. Verify

- [x] 5.1 `npx nx run-many --target=lint --target=test --target=build --all` green in `platform/`,
      with the cache skipped.
- [x] 5.2 Both pass: the project holds 141 spec files and the suite reports 141 passed, 1,288 tests.
      A bare `vitest run` against the library fails on all 141 — Angular projects here compile through
      `@nx/angular:unit-test` with the project's build options, so `nx test` is the only meaningful
      runner. Worth knowing before someone reads a bare run as a regression.
- [x] 5.3 `npm run import-cycles-check` reports 0 file cycles and 21 mutual slice pairs.
- [x] 5.4 `openspec validate --all --strict` passes.
