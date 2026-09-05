> **Status:** approved — approved for implementation on 2026-09-05.

## Why

Building the tutorial example from the published 0.8.3 CLI on 2026-09-05 exposed two ways the
scaffold's own output does not work as it stands. A second generated weaver silently disables the
first, because the composition root ends up with two `provideCapabilityGrants` calls and only the
last one counts; and a distribution written over an `ng new` application leaves that application's
own starter test in place, which fails as soon as the shell renders. Both are defects against what
the `scaffolding` capability already guarantees, both are met by every reader of the upcoming dev.to
tutorial on their first two commands, and the tutorial's second step is currently a workaround for
them. They ship fixed in 0.8.4, before the article publishes.

## What Changes

- **Grants compose.** A distribution may declare capability grants in more than one place, and the
  effective grant for a plugin is the union of what every declaration says about it. The generated
  composition root keeps appending one call per weaver, as it does today, and every weaver
  activates. A single call with all plugins in it, the shape the demo uses, keeps working unchanged.
- **The composition root's starter test is one that passes.** When the distribution scaffold is
  written into an application workspace that runs unit tests, it replaces the application's starter
  test with one that boots the shell with the composition root's own providers, so the project's
  tests are green immediately after scaffolding. The generated notes stop telling the consumer to
  delete the file, and the quick-start guard stops deleting it on the consumer's behalf and runs
  the tests instead.
- **The failure is pinned.** A test in the shell composes two grant declarations and expects both
  plugins to hold what they were granted; the guard that scaffolds the quick start end to end
  scaffolds two weavers and runs the project's tests.

Neither change breaks a consumer: one grants call behaves exactly as before, and a consumer who
already deleted or rewrote `app.spec.ts` is not touched, because the scaffold overwrites only
under the flag it already requires for the files it owns.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-permissions`: a grant declared in several places composes, per plugin, into one
  effective grant; today the guarantee speaks of "the distribution grants" as if there were one
  place.
- `scaffolding`: the generated distribution's tests pass without further edits, alongside the
  existing guarantee that it serves without further edits; and a plugin generated beside another
  leaves the other working.

## Impact

**Shell.** The capability-grant provider and the service that reads it, under
`platform/libs/core/shell/src/lib/permissions/`, plus their tests.

**Devkit and CLI.** The distribution recipe and its notes under
`platform/libs/tooling/devkit/src/recipes/angular-distribution/`, and the recipe test. The weaver
composition (`lib/amend/compose.ts`) is not changed: appending a call per weaver becomes correct
once grants compose.

**Guards.** `platform/tools/check-quick-start.mjs` stops deleting the starter test and runs the
generated project's tests.

**Documentation.** `docs/getting-started.md` and `docs/manual-setup.md` where they describe the
composition root or the starter test; `docs/reference/operations.md` where it describes the
quick-start guard. The tutorial example under `examples/assistant-workbench/` keeps its single
merged call, which stays valid.

**Release.** Ships in the next patch release, which the dev.to tutorial's code link and degit tag
point at.

**Legacy sources dissolved.** None.
