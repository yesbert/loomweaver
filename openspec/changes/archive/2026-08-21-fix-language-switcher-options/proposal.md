> **Status:** approved.

## Why

The workbench serves a fixed set of languages, and the switcher that offers them keeps its own copy
of that list. They agree today. Adding a language would make it storable, detectable and loadable
while leaving it unreachable from the switcher — the "advertised but inert" failure this project has
paid for repeatedly, here in the opposite direction.

This is a defect against an existing requirement, not a new capability: `i18n` already requires that
the switcher offers the languages the workbench can serve.

Found while backfilling `i18n` (finding F-05).

## What Changes

- The switcher derives its options from the set of served languages, keeping the label and flag as a
  lookup beside it. No behaviour changes today; the two lists agree.
- A test pins the requirement, so a third language cannot be added on one side only.
- A second test pins the cross-window language guarantee, which rests on the implementation alone
  today (finding F-06). The cross-window suite covers appearance, view state, layout and identity,
  but not language.

## Capabilities

### Modified Capabilities

- `i18n`: the requirement that the switcher offers what the workbench serves gains the scenario the
  defect showed was missing — that adding a served language reaches the switcher without a second
  list being edited.

## Impact

The cross-window guarantee needs no specification change; `i18n` already states it. Only its test is
missing.
