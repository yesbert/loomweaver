## 1. The workspace

- [x] 1.1 Rename the path mappings in `platform/tsconfig.base.json`, including the internal
      `testbed-weaver` alias, so nothing in the workspace resolves through the old scope.
- [x] 1.2 Rename the `name` field of the seven package manifests under `platform/libs/` and every
      peer dependency they declare on each other.
- [x] 1.3 Change the `bin` entries: `loom` becomes `loomweaver`, `loom-mcp` becomes
      `loomweaver-mcp`, and update the invocations in the documentation and in the MCP configuration.
- [x] 1.4 Replace the remaining occurrences of `@loom/` in the TypeScript sources, the styles and
      the configuration across `platform/`.

## 2. Scaffolding

- [x] 2.1 Update the 20 files in `devkit` and `cli` that write the scope into generated code, the
      manifests they produce and the dependency lists they add.
- [x] 2.2 Update the generator tests that assert on the emitted imports.
- [x] 2.3 Scaffold a weaver by hand from the built CLI and confirm it compiles against the renamed
      packages.

## 3. Documentation

- [x] 3.1 Update the 16 files under `docs/` and the five in the repository root: `README.md`,
      `CONTRIBUTING.md`, `SECURITY.md`, `llms.txt`, `llms-full.txt`.
- [x] 3.2 Update the three Azure pipelines that name the packages they pack, publish or install.
- [x] 3.3 Leave the archived changes as written, and note in `docs/chronicle.md` that the scope
      changed on 2026-08-27 and that older records name the previous one.

## 4. Proof

- [x] 4.1 Run the full gate: lint, unit tests, the build of all seven packages, the licence check.
- [x] 4.2 Confirm no occurrence of `@loom/` remains outside the archived changes and the chronicle
      note.

## 5. The demo, and the release it needs

The demo installs from the feed rather than from source, and the publish pipeline refuses to run
anywhere but on a version tag. The demo can therefore only follow the release, never accompany it:
it stays on the old scope until 0.7.1 exists under the new one.

- [x] 5.1 Ask the maintainer for the go on releasing 0.7.1 to the private feed under the new scope.
- [x] 5.2 Merge the rename with the demo untouched. It keeps installing the previous packages from
      the feed, so the gate stays green and the deployed demo keeps working.
- [x] 5.3 Bump to 0.7.1 on its own branch, merge it, tag `v0.7.1` on the resulting `main`, and let
      the publish pipeline put the seven renamed packages on the feed.
- [x] 5.4 In a follow-up pull request, move the demo across: the dependencies, the scope in
      `demo/.npmrc`, the imports in its sources, and a refreshed `demo/package-lock.json`. Keep the
      feed authentication; removing it belongs to the move to GitHub.
- [x] 5.5 Confirm the demo builds and deploys against the renamed packages, then continue with
      `loomweaver-moves-to-github`.
