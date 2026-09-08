## 1. Pin the defect

- [ ] 1.1 A failing test in the MCP tool tests: `scaffold_auth_source` with a name and no directory
      names the icon provider, the composition and the asset glob among its remaining steps.
- [ ] 1.2 A failing test that walks every scaffold the MCP route offers and asserts that generated
      output needing workspace wiring names it.

## 2. Fix

- [ ] 2.1 `authSourceAmendments` returns the directory-independent amendments without a directory
      and describes the directory-bound ones with a location placeholder.
- [ ] 2.2 The weaver's amendments the same way, and the existing test that expected `remaining` to
      be undefined for a plain weaver is updated to expect the steps.
- [ ] 2.3 Run the CLI and the Nx generator once each to confirm they still apply rather than name.

## 3. Verify

- [ ] 3.1 The MCP tool tests are green, and `scaffold_auth_source` over a real client shows the
      steps in the response.
- [ ] 3.2 `docs/scaffolding.md`'s adapter table is checked against the new behaviour.
- [ ] 3.3 `openspec validate the-mcp-route-names-the-steps-it-cannot-do --strict` passes.
