## 1. Pin the defect

- [x] 1.1 A failing CLI test: `weaver --id notes --out .` in an Angular CLI workspace composes the
      plugin and adds the asset glob and the stylesheet source.
- [x] 1.2 A failing CLI test: `auth-source --name dev --out .` composes the session plugin with its
      providers and the icon import.

## 2. Fix

- [x] 2.1 The CLI hands the recipes a value that means "here" for the working directory, and the
      recipes' empty-directory guard distinguishes it from "no directory".
- [x] 2.2 The MCP tests and the Nx generator tests stay green.

## 3. Verify

- [x] 3.1 `openspec validate the-cli-at-the-workspace-root-still-wires --strict` passes.
