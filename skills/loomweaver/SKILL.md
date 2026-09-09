---
name: loomweaver
description: Build on LoomWeaver, the plugin platform for Angular workbenches. Scaffold weavers, themes, auth sources, settings stores and layouts through the @loomweaver/mcp generators instead of writing plugin code from memory, then validate what came out. Use in any project that depends on @loomweaver/shell.
license: MIT
---

This is the procedure, not the contract. Every rule it names lives on a page it links; read the page
before arguing with the rule.

The order is the point: **call the generator before you explore the project.** It needs an id and a
shortcut, nothing about the code around it, and reading first buys you nothing you cannot read after.

## Detect

- A fresh Angular application or Nx workspace with no distribution yet gets one command, run in the
  shell, not assembled by hand: `npx @loomweaver/cli init`. The distribution stays with the CLI on
  purpose, because that is the only route that also wires the workspace around it, and a step missed
  there surfaces as an unstyled page rather than as an error.
  [Getting started](https://loomweaver.dev/getting-started/)
- A project that already depends on `@loomweaver/shell` gets the generators below, and the first
  call is the generator itself. [Building a distribution](https://loomweaver.dev/building-a-distribution/)

## Generate

- Never write a manifest, a plugin class, a theme or a store from memory. Call the tool:
  `scaffold_weaver`, `scaffold_theme`, `scaffold_auth_source`, `scaffold_settings_store`,
  `scaffold_layout`, `scaffold_frame_plugin`. `list_generators` says what each one takes.
  [Scaffolding](https://loomweaver.dev/scaffolding/)
- The server has no reach into the workspace by design. It returns a file map and names the steps
  that remain; you write the files and you do those steps.
- Place it once the file map is back, not before: `LOOMWEAVER.md` and the composition root say where
  this product keeps its weavers, and what you generated goes beside the ones already there.
- The generated `README.md` in that file map is a checklist, not a file to write. It lists the
  wiring the weaver needs. Read it, then make those edits.
- A weaver that an agent should drive at runtime is scaffolded as one from the start, rather than
  retrofitted. [Driving your product with an AG-UI agent](https://loomweaver.dev/ag-ui-agents/)
- What no generator writes is in the recipes, already compiling against the published contract.
  [Samples](https://loomweaver.dev/samples/)

## Validate

- `validate_manifest` on the manifest, `validate_commands` on the sources, `validate_i18n` on the
  bundles, `validate_catalog` on a plugin catalog. They return findings, so act on what they name.
- Then build and run the tests. A scaffold that compiles is not yet a scaffold that is wired.

## Compose

- Grants are exactly what the manifest declares, no more. Capabilities are default-deny, and a
  plugin that asks for nothing gets nothing. [Capabilities](https://loomweaver.dev/distribution/capabilities/)
- Templates use semantic tokens and the `.lw-*` classes, never a raw palette colour. A lint guard
  rejects the rest. [Design tokens](https://loomweaver.dev/reference/design-tokens/)
- Shortcuts are written with the `mod` token, so one declaration is correct on every platform.
  [Commands](https://loomweaver.dev/weaver/commands/)
- Translations are composed by namespace, and the two bundles stay in parity.
  [Translations](https://loomweaver.dev/weaver/i18n/)
- Icons resolve from the shell's own map before you add one.
  [Icons](https://loomweaver.dev/reference/icons/)
- The content area is the Angular router. You write no `Routes` and no `canActivate`.
  [Routing](https://loomweaver.dev/reference/routing/)

## Where the rest is

The contract in one fetch is [llms-full.txt](https://loomweaver.dev/llms-full.txt); the map of every
page is [llms.txt](https://loomweaver.dev/llms.txt). The mental model, platform and weaver and
distribution, the uniform `ctx` and the two RPC boundaries, is
[Architecture](https://loomweaver.dev/architecture/).
