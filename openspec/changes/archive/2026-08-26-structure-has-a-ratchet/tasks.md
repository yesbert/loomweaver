## 1. Write the rule down

- [x] 1.1 Add the two thresholds to `.claude/docs/reference/engineering-standards.md`: at most 12
      concepts per folder, a source file over 400 lines must be justified, and the definition of a
      concept as one non-spec `.ts` file.
- [x] 1.2 State the cutting rule beside them: a folder that exceeds the threshold is cut into
      sub-themes named for what they do, never into folders named for a technical kind. Name
      `regions/content` (`access/`, `routing/`, `tabs/`) and `elements/` (`button/`, `icon/`,
      `select/`) as the two worked examples already in the tree.
- [x] 1.3 Record in the same place that technical segments inside a slice are deliberately deferred,
      so a future reader does not re-open the question as if it were an oversight.
- [x] 1.4 Add both thresholds to the `operations.apply.guidance` block in `openspec/config.yaml`,
      beside the line that already says folders are cut by feature and never by technical type. This
      is the one place read on every single change application, so it is what makes the rule apply to
      future work rather than only to this audit. The wording stays short: the standards carry the
      reasoning, the config carries the number.

## 2. Build the checker and calibrate it

- [x] 2.1 Write `platform/tools/check-structure.mjs`: walk `platform/libs` and `platform/apps`,
      skipping `node_modules`, `dist` and generated output, and report every folder whose direct
      non-spec `.ts` children exceed 12 and every non-spec `.ts` file longer than 400 lines.
- [x] 2.2 Read and enforce `platform/tools/structure-baseline.json` with the ratchet semantics used
      by `cycle-baseline.json`: a new entry fails, a worse existing entry fails, and an entry that no
      longer applies fails as stale.
- [x] 2.3 Calibrate before believing the output. The first run must report exactly the five folders
      and ten files listed in the proposal. If it reports more or fewer, the checker is wrong until
      proven otherwise, not the tree.
- [x] 2.4 Add a deliberate probe to prove the checker bites: create a throwaway file of 401 lines and
      a throwaway folder of 13 concepts, confirm both fail, then remove them.
- [x] 2.5 Confirm the checker is path-scoped correctly by running it from the repository root and
      from `platform/`, since a scoped invocation that silently matches nothing has produced a false
      "clean" in this repository before.

      Recorded: calibration matched the proposal exactly. Five folders (31, 22, 22, 21, 14) and ten
      files (942, 752, 708, 544, 515, 492, 475, 412, 409, 403), same paths, same order. The first
      run reported each file one line long because splitting on the newline counts the terminator as
      a line; the checker now uses `wc -l` semantics and the ten numbers agree with the audit. The
      probe bit in both directions, and a deliberately tampered baseline produced all four failure
      kinds: new entry, worse entry, improved entry still over the threshold, and stale entry. Run
      from the repository root and from `platform/` it reports identically, so the scoping is not
      silently empty.

## 3. Wire it in

- [x] 3.1 Add `structure-check` to the scripts in `platform/package.json`, beside the six existing
      `*-check` scripts.
- [x] 3.2 Add the CI step to `azure-pipelines-build.yml` in the "Build + test" job, beside the other
      guards, with a display name that says what it guards.
- [x] 3.3 Add the row to the guards table in `.claude/docs/reference/operations.md`, naming the
      script and the baseline file.

## 4. Verify

- [x] 4.1 `npx openspec validate --all --strict` passes.
- [x] 4.2 All seven guards pass on the branch.
- [x] 4.3 The packed declarations of all six packages are byte-identical to `main`: this change moves
      no code and must not touch the published contract.

      Recorded: no file under `platform/libs` or `platform/apps` is touched by this change, so
      byte-identity holds by construction. Packaged anyway and kept the result as the reference for
      the three cuts that follow: 53 `.d.ts` files, 4448 lines, digest
      `5e70a710a2818c549c5a08fc8b84d1d2844b6eeb`.
- [x] 4.4 The test count is unchanged.

      Recorded: `shell` 141 test files, 1288 tests. This is the number the three cuts are measured
      against.
