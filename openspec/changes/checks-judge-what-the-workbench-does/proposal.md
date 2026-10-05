> **Status:** proposed — not approved for implementation yet.

## Why

The checks a consumer runs on their own declarations exist to say what the workbench will do with
them. In several places they say something else. The command check misreads valid registrations — a
`callable: true as const`, an id held in a constant, a destructured `registerCommand`, an explicit
`description: undefined` — and cannot read JavaScript at all, so a frame plugin's own script goes
unchecked. The manifest check refuses an id the workbench accepts. The catalogue check names the
wrong entry when an invalid one shares an id with a valid one, and stays silent about metadata the
workbench drops. And the assistant route describes its options without the patterns and defaults
the Nx route publishes, while the generator descriptions are kept by hand and have drifted.

## What Changes

- The command check reads `true as const`, shorthand properties and ids or titles held in string
  constants the file declares, finds `registerCommand` however it is reached, treats an explicitly
  undefined description as absent, and reads JavaScript files as well as TypeScript.
- The manifest check reports an id that is not kebab-case as a convention warning, saying the
  workbench accepts it, instead of an error claiming it will be refused.
- The catalogue check judges duplicate ids the way the workbench does, after an entry is parsed, and
  reports metadata of the wrong type that the workbench drops.
- The assistant route publishes each option's pattern and default, from the same descriptor the Nx
  schema is generated from; the layout option gains the pattern its recipe already enforces.
- The generator collection's descriptions come from the scaffold descriptors, or a test pins them
  to the descriptors, so they cannot drift again.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Each item is a defect against "A consumer can have their own declarations checked" — a finding
names the consequence, and a check distinguishes what it can judge from what it cannot — or against
"One description of a generator serves every way of invoking it". The change sets `skip_specs` and
pins each case with a test.

## Impact

- Dev kit: the command, manifest and catalogue checks; the scaffold descriptors (layout pattern);
  the generator collection's descriptions.
- Command-line: `validate-commands` walks `.js` files too.
- Assistant server: input schemas carry patterns and defaults.
- Guides: the scaffolding guide's description of the checks, where it names what they read.
