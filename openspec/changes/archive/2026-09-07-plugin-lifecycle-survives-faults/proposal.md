> **Status:** approved.

## Why

An independent review of the published packages reproduced three faults in how the workbench
handles a plugin that misbehaves, or a composition root that says the same thing twice. Each is
a case the contract already covers and the implementation does not honour, and each leaves the
workbench in a state it claims cannot exist: a healthy plugin stripped of its contributions, a
second plugin's contributions left behind after everything was told to unload, and a distribution
whose translation bundles are silently reduced to the last one it named.

## What Changes

- A plugin whose activation fails late, after it was deactivated and activated again, no longer
  takes the newer, healthy activation with it. The failure is attributed to the activation that
  produced it, and only that one is undone.
- A plugin whose own teardown throws is still unloaded completely: its contributions are gone, its
  grants are released, and the plugins after it are unloaded as well. The failure is reported once
  everything has been undone, rather than aborting the unload in the middle.
- Declaring translation bundles more than once accumulates them. A composition root that names
  `notes` in one place and `copilot` in another loads both, in the order they were declared.
- Not in scope: the scaffold's own registration of a second bundle, which already joins the
  existing declaration and is covered by its own tests.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-runtime`: the requirement that activation is isolated per plugin gains the case of a
  failure that arrives after the plugin was already activated again; the requirement that
  contributions live and die with their plugin gains the case of a teardown that throws.
- `i18n`: the requirement that a contributed bundle is nested under its own name gains the rule
  that declarations accumulate rather than replace one another.

## Impact

- The plugin runtime in the shell: how an activation failure is matched to its activation, and
  how deactivation orders its steps.
- The translation namespace provider and its loader in the shell: a multi-provider in place of a
  single value.
- The published contract does not change shape: the same function is called the same way. What
  changes is that a second call now adds to the first.
- No storage, no port and no plugin-facing API is touched.
- No legacy source is dissolved by this change.
