## 1. Pin the defect

- [x] 1.1 A failing test in the MCP tool tests: `scaffold_auth_source` with a name and no directory
      names the icon provider, the composition and the asset glob among its remaining steps.
- [x] 1.2 A failing test that walks every scaffold the MCP route offers and asserts that generated
      output needing workspace wiring names it.

## 2. Fix

- [x] 2.1 The MCP route passes a placeholder location to `amend`, so every directory-bound
      amendment is described rather than dropped; the recipes stay as they are.
- [x] 2.2 The existing test that expected `remaining` to be undefined for a plain weaver is
      updated to expect the steps.
- [x] 2.3 Confirm the CLI and the Nx generator still apply rather than name: their code is
      untouched, and their suites run green.

## 3. Verify

- [x] 3.1 The MCP tool tests are green, and `scaffold_auth_source` over a real client shows the
      steps in the response.
- [x] 3.2 `docs/scaffolding.md`'s adapter table is checked against the new behaviour.
- [x] 3.3 `openspec validate the-mcp-route-names-the-steps-it-cannot-do --strict` passes.
