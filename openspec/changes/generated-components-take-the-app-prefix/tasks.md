One pull request: first the tests that fail on the current code (their failure messages go into the
pull request), then the fix. Paths are relative to `platform/libs/tooling/` unless they start with a
top-level folder.

## 1. The generators

- [ ] 1.1 The Nx weaver generator, run without `--prefix` into a workspace whose composing application
  declares a prefix, names the generated components with it; the application's prefix is read where
  the composing application is already resolved (`devkit/src/generators/workspace-tree.ts`,
  `devkit/src/generators/weaver/`).
- [ ] 1.2 The CLI's weaver scaffold, run without `--prefix`, names the components with the prefix the
  Angular application declares in `angular.json` (`cli/src/lib/scaffold/`,
  `cli/src/lib/angular-config.ts`).
- [ ] 1.3 Where nothing is supplied or read, the weaver recipe, the Nx weaver generator and the Nx
  distribution generator default to `app`; the distribution's lint configuration lists `app` once
  (`devkit/src/recipes/angular-weaver/weaver-input.ts`, `devkit/src/generators/weaver/nx-files.ts`,
  `devkit/src/generators/distribution/nx-files.ts`).
- [ ] 1.4 The MCP weaver tool's description of `prefix` asks for the application's prefix and names
  the neutral default (`mcp/src/`).
- [ ] 1.5 A supplied prefix still wins on all three routes, pinned by the existing tests or a new one
  where none covers it.

## 2. Documentation and hand-over

- [ ] 2.1 `docs/scaffolding.md`, the devkit, CLI and MCP READMEs and `llms-full.txt` say where the
  default prefix comes from.
- [ ] 2.2 Run `openspec validate --all --strict`, the devkit, CLI and MCP unit suites and
  `check-quick-start`; name the new default under "Changed" in the notes of the release that carries
  it; archive the change.
