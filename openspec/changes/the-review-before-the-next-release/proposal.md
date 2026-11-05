> **Status:** approved.

## Why

A full code review on 2026-11-05, two weeks after the audit before 0.20.0, read the shell, the
plugin SDK, the frame kit, the AG-UI adapter, the scaffolding tools, the testbed, the demo, the
example, the guards and the release workflow. It found some eighty defects, and it stopped short of
a few areas it names. The thirteen findings SonarQube held `main`'s gate on are fixed already
(#847). This change is the worklist for the rest.

Nearly all findings are defects against requirements the specifications already state: a product's
own plugin cannot be shadowed, the catalogue is read defensively, unsaved work keeps a surface
alive, the same question is asked wherever work would be destroyed, a surface reads its address the
same way in every pane, adopting a namespace reads it before it writes to it, typing is not
hijacked, a generator only adds. Those need a fix and a test that pins it, not a new requirement.

One needs a requirement. A contribution is replaced by a later one with the same id, which is what
lets a distribution override a bundled plugin. Nothing limits that to the distribution: a plugin
installed from a catalogue, holding only the right to contribute, could replace the product's own
route, view or menu entry, and the original stayed gone after the plugin was removed.

## What Changes

- A plugin that does not run as the application's own code can no longer replace a contribution
  another owner registered. The registration is refused and reported. Replacing stays what it was
  for the distribution and the plugins composed into it.
- Every other finding is fixed where it sits, each with a test that fails before the fix. The task
  list names them by area: the plugin trust boundary, unsaved work and panes, addresses and tabs,
  persistence and workspaces, commands and menus, the chrome, the agent connection, the scaffolding
  tools, the demo and the example, the tests that could not fail, the guards and the release
  workflow.
- The areas the review did not reach are reviewed, and what that finds joins the list.
- No published name is removed or renamed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-runtime`: a plugin that does not run as the application's own code cannot replace a
  contribution another owner registered.

## Impact

- `@loomweaver/shell`: plugin runtime, plugin store, permissions, panes, content tabs, routing,
  persistence, workspaces, commands, menus, dialogs, the UI kit, bars, rails, sidebars, pop-outs,
  capture and translations.
- `@loomweaver/ag-ui`: the tool-call assembly across runs and a failing hook.
- `@loomweaver/cli`, `@loomweaver/devkit`, `@loomweaver/mcp`: path handling, the `init` route in an
  Nx workspace, composing into a file formatted differently, the command check, the PostCSS wiring.
- The demo and the assistant workbench example, the testbed and its end-to-end suite.
- The guards under `platform/tools/checks/`, the licence check and the release and deploy
  workflows. The bundle-size ceilings move once, because the guard starts counting every initial
  file.
