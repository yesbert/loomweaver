## 1. The rule

- [x] 1.1 `CONTRIBUTING.md`: a section *Writing the docs* (page kinds, four sentence rules, the header,
      the tone) before *Commits and pull requests*.

## 2. The guard

- [x] 2.1 `platform/tools/check-docs-style.mjs`: header, spelling, long sentences against a per-page
      baseline; `--write-baseline`, `--list`.
- [x] 2.2 `platform/tools/docs-style-baseline.json` written from the current pages.
- [x] 2.3 `npm run docs-style-check` in `platform/package.json`; a step in
      `.github/workflows/build.yml` beside `structure-check`; a row in the guards table of
      `docs/reference/operations.md`.

## 3. The first pass

- [x] 3.1 The pages this arc wrote: `docs/concepts/*`, `docs/authoring-a-weaver.md`,
      `docs/building-a-distribution.md`, `docs/getting-started.md`, `docs/README.md` at zero long
      sentences; baseline rewritten.

## 4. Verify

- [x] 4.1 `npm run docs-style-check` passes; removing a header or lengthening a sentence fails it.
- [x] 4.2 `openspec validate docs-style-guard --strict`.
