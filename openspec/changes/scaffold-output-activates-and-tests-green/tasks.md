## 1. Grants compose in the shell

- [x] 1.1 Red test first, in the capability-grant service's spec: two grant declarations, one per
      plugin, and both plugins hold what they were granted; a second test where two declarations
      name the same plugin and the effective set is their union intersected with the declaration.
      Both fail against the current last-wins reading.
- [x] 1.2 The grant helper registers a multi provider and the service merges every declaration per
      plugin id, union of the lists; a plugin no declaration names holds nothing. The single-call
      shape is covered by the existing tests, which keep passing unchanged.
- [x] 1.3 The JSDoc on the published helper says that several calls add up, because that is now part
      of the contract; `api-docs-check` passes.

## 2. The distribution scaffold owns the starter test

- [x] 2.1 Red test first, in the distribution recipe's spec: with tests enabled the recipe writes
      `src/app/app.spec.ts` booting the root component with the composition root's providers and
      asserting the shell element rendered; with tests disabled it writes no such file.
- [x] 2.2 The recipe writes that file under the same overwrite rule as the root component's files,
      and the generated notes lose the sentence telling the consumer to delete it.
- [x] 2.3 The devkit and CLI tests that snapshot the distribution's file list include the new file.

## 3. The guard runs what a reader runs

- [x] 3.1 `platform/tools/check-quick-start.mjs` stops deleting the starter test, scaffolds its two
      weavers as it already does, builds, and then runs the generated project's unit tests;
      `docs/reference/operations.md` describes the guard's new step in one sentence. The guard
      also expects both generated weavers' commands in the panel's offer, which is what turns red
      against a shell whose grants do not compose.
- [x] 3.2 Run the guard locally against the bundled CLI before opening the pull request; with the
      two fixes both steps pass, and without them the guard is red. Run 2026-09-05 against the
      repacked shell: green, with both generated commands in the offer; against the shell packed
      before the fix it saw one, which is the red the change wanted.

## 4. Documentation and hand-over

- [x] 4.1 `docs/getting-started.md` and `docs/manual-setup.md`: wherever they describe the composition
      root's grants or the starter test, they describe the new behaviour; the formatter and the
      dash checker pass.
- [ ] 4.2 The tutorial example under `examples/assistant-workbench/` keeps its single merged call;
      the change confirms it still builds and tests against the fixed shell only once a release
      carrying the fix is published, by bumping its dependency range in a follow-up alongside the
      tag. Open: main moved to the 0.9.0 preview line on 2026-09-05, so which release carries the
      fix for the tutorial's readers is the owner's call.
- [x] 4.3 `openspec validate scaffold-output-activates-and-tests-green --strict` passes; the pull
      request names the reproduction (two weavers from the 0.8.3 CLI) and the tutorial that waits
      on 0.8.4.
