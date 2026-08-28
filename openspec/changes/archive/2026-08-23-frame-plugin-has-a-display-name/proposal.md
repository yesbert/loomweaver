> **Status:** approved.

## Why

A frame plugin the distribution composed appears to the user under its identifier. Beside plugins
that show a name — *Insights*, *Quotes* — the demo's payment matching is listed as `payments`, and a
user reading the permissions surface is asked to make a decision about a thing named the way code
names things.

The gap is narrow and one-sided. A plugin listed in a catalogue already carries a name, because an
entry has one; the same plugin composed at build time carries nothing but its identifier, and the
surfaces that show it have nowhere else to look. So the plugin a distribution vouched for most
directly is the one it can say least about.

## What Changes

- A composed frame plugin MAY carry a name, and where it does, the workbench SHALL use that name
  wherever it names the plugin to the user.
- Where it carries none, the identifier stays what is shown — an identifier is a poor name but a
  correct one, and inventing a prettier one would name a plugin something its composition never said.
- The identifier remains what everything else is keyed on. A name is what is read, never what is
  matched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-sandbox`: gains a requirement that a composed frame plugin may carry a name, and that the
  workbench reads it where it names the plugin to the user.

## Impact

- The registration a distribution writes for a frame plugin — one optional field, so every existing
  composition keeps compiling and keeps behaving as it does today.
- **BREAKING**: none. The field is optional and its absence is today's behaviour.
- The surfaces that list plugins to the user, which today reach for a name and find only an
  identifier for this kind of plugin.
- `openspec/specs/plugin-sandbox/spec.md` — one added requirement.
- A release, because the registration type is part of the published contract; the demo then names its
  payment plugin.

Nothing is dissolved: no decision record, guide or specification is superseded by this change.
