> **Status:** approved

## Why

A plugin a distribution declared not optional, holding nothing beyond the right to register
contributions, fills a section under Permissions in which nothing can be operated (F-006). The switch
is withheld, correctly, because the plugin is not optional. The capability list is empty, correctly,
because the right to contribute is not revocable. What is left is a heading and two sentences that
describe controls the section does not contain: one says what holds the plugin back is "what you
granted it below", the other promises that "what it is allowed to do can still be changed". Below
both is an empty list.

The surface is a page about what may be permitted. A part with nothing that can be permitted has
nothing to say there, and saying it anyway costs the reader a search for controls that are not there.

## What Changes

- A plugin that offers neither a switch nor a capability that can be withdrawn is left out of the
  permissions surface rather than drawn as an empty section.
- **BREAKING for a consumer that asserted the old wording**: the requirement that such a plugin is
  listed is replaced. NextPA's own capability says the same and follows this change.
- Everything else is untouched: a plugin with a switch is listed, and so is one whose capabilities
  can be seen even where they cannot be withdrawn.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `plugin-permissions`: the requirement that a not-optional plugin is listed now says where the
  listing stops, which is where there is nothing left to permit.

## Impact

- `platform/libs/core/shell/src/lib/permissions/permissions-settings.ts` — one filter.
- A distribution whose only plugins are required and contribution-only now sees the empty state on
  that page, which is what it means.
