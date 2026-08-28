## 1. Establish what is published

- [x] 1.1 Read the packed `loom-shell.d.ts` and record which symbols from `plugin-store` reach the
      published contract. Note them in this task; anything published needs `src/index.ts` updated and
      the byte-identity check to cover it.

## 2. Cut the folder

- [x] 2.1 `catalog/`: `catalog-entries.ts`, `plugin-catalog.ts`, `provide-plugin-catalog.ts`, and
      `format.ts` unless the open question resolves it to the slice root.

      Resolved to the slice root, by the method design.md named: `format.ts` has exactly two
      importers, `plugin-store-card.ts` and `plugin-store-detail.ts`, and both stay at the root as
      parts of the dialog. Nothing in `catalog/` calls it. `catalog/` therefore holds three
      concepts, the root nine.
- [x] 2.2 `lifecycle/`: `install-consent.ts`, `consent-deps.ts`, `plugin-install.service.ts`,
      `plugin-deployment.service.ts`, `uninstall-confirm.ts`, `plugin-update.ts`,
      `update-consent.ts`, `plugin-enablement.service.ts`, `plugin-disable-guard.ts`.
- [x] 2.3 Leave the dialog and its parts at the slice root: `plugin-store-dialog.ts`,
      `plugin-store-card.ts`, `plugin-store-detail.ts`, `plugin-store-settings.ts`,
      `plugin-store-title.ts`, `plugin-store.service.ts`, `installed-plugin.ts`,
      `installed-plugin-list.ts`.

      One correction to design.md's reasoning, not to its placement: `installed-plugin.ts` is not a
      renderer. It is the model of an installed plugin and a catalog entry plus their defensive
      parsers, and every one of the three themes imports it. It stays at the root because it is the
      slice's shared model, not because it renders anything.
- [x] 2.4 Move every `.spec.ts` and `.html` with the concept it belongs to. A spec never separates
      from its subject.
- [x] 2.5 Update every importer. No re-export shims: a symbol has one home.

## 3. Types out of the class files

- [x] 3.1 Find the files under `plugin-store` that export a type or constant beside a decorated
      class and move those into files named for the concept, following `settings/settings-model.ts`.

      One found: `PluginInfo`, declared inside `plugin-enablement.service.ts` beside the service and
      published as a type. It now lives in `lifecycle/plugin-info.ts`. The two bare `export type`
      forwarding lines found in task 1.1 went with it, since a type re-exported from a class file is
      the same defect wearing a different hat: `plugin-install.service.ts` no longer forwards
      `InstalledPlugin` and `plugin-catalog.ts` no longer forwards `PluginCatalogEntry`. Their four
      consumers, including two specs and the sandbox runtime, now import the model directly. No
      other file under the slice exports a type or constant beside a decorated class.

## 4. Verify

- [x] 4.1 `nx package shell` succeeds and the packed declarations of all six packages are
      byte-identical to `main`.

      Recorded: identical but for one blank line. The 181 exported names are the same set in the
      same order, every declaration is character-for-character the same, and `diff -B` is empty. The
      one added line is the module seam the flattener now writes where `PluginInfo` used to share a
      file with its service. That is the unavoidable price of task 3.1, and it changes nothing a
      consumer can observe.
- [x] 4.2 All seven guards pass. Trim `structure-baseline.json` by the resolved entry and confirm the
      checker fails if the trim is too generous.

      Recorded: the 21-concept folder entry is gone and no new one appeared, so four folder entries
      remain. The ratchet also caught something nobody aimed at: `sandbox-plugin-runtime.ts` fell
      from 515 lines to 513 when its four-line import block became two, and the checker refused to
      pass until the baseline said 513. A deliberately over-generous trim, dropping the untouched
      `plugin-sdk` entry as well, failed as expected.
- [x] 4.3 Re-measure `cycle-baseline.json`, trim or extend it honestly, and record the resulting
      slice pair count in this task.

      Recorded: unchanged at 21 mutual slice pairs and zero file cycles, over 212 files rather than
      211. Nothing to trim and nothing to extend. The cycle checker counts a direct child of `lib/`
      as one slice, so every file under `plugin-store` still belongs to `plugin-store` whichever
      sub-theme it now sits in. A folder cut at this depth cannot move that number, which is worth
      knowing before the pane cut is measured against the same expectation.
- [x] 4.4 The test count is unchanged or higher.

      Recorded: 141 test files, 1288 tests, unchanged.
- [x] 4.5 `npx openspec validate --all --strict` passes.
