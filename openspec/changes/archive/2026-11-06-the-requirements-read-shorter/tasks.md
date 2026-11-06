# Tasks

Each task is done when the capability has no requirement over 500 characters and an independent
read finds every statement of the old text in the new one.

## 1. Shorten the long requirements

- [x] 1.1 ui-primitives, commands, menus, accessibility
- [x] 1.2 workspaces, scaffolding, surfaces, plugin-permissions, plugin-sandbox, plugin-store, plugin-runtime
- [x] 1.3 shell-layout, i18n, routing, content-tabs, panes, product-identity, surface-retention, workbench-capture, persistence-ports, platform-composition, access-gating, containers, gesture-configuration, theming

## 2. Check

- [x] 2.1 An independent read compares every changed requirement with its old text and finds nothing dropped or changed in meaning
- [x] 2.2 `openspec validate --all --strict` passes
