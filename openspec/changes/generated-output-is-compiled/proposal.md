> **Status:** approved — approved for implementation on 2026-10-06.

## Why

The scaffolding specification promises that generated output compiles against the published contract
and needs no repair. Today that is checked for very little: the nightly quick start builds one
distribution, one weaver with a command and an agent, and one stand-in session; the escaping tests
parse output generated with an awkward name. Every other feature — a weaver with settings, an about
dialog, a menu entry, a bar item, named instances, a container, an access requirement — and the
theme, layout and settings-store scaffolds are only ever matched as strings. A recipe can emit code
that calls a renamed export and every test stays green, which is exactly how the frame plugin
scaffold fell behind the frame kit unnoticed.

## What Changes

- A check generates every scaffold across its feature combinations and type-checks the TypeScript it
  emits against the plugin SDK and the shell as they are built, and parses every Angular template it
  emits with the Angular compiler.
- The frame plugin's emitted scripts are run against a stand-in of the frame kit and the RPC
  transport, so a call to something the kit no longer offers fails.
- The check runs in the pull-request build, beside the other guards, so a recipe that falls behind
  the contract fails the change that caused it rather than a consumer's first build.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The guarantee exists ("Generated output builds, passes its own checks, and needs no repair");
this change makes the build hold it for every scaffold instead of a sample. It sets `skip_specs`.

## Impact

- Dev kit: a new spec, or a guard under the platform's checks, that generates and compiles.
- CI: one more step in the pull-request build; its run time is measured and kept under a minute.
- No published API changes.
